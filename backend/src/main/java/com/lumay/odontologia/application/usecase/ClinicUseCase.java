package com.lumay.odontologia.application.usecase;

/*
 * ================================================================
 * AULA: USE CASE — O CORAÇÃO DA LÓGICA DE NEGÓCIO
 * ================================================================
 *
 * UseCase = "caso de uso" = uma ação que o sistema pode fazer.
 *
 * O ClinicUseCase tem toda a lógica relacionada a clínicas:
 *   - Registrar uma nova clínica (com admin)
 *   - Atualizar dados da clínica
 *   - Listar clínicas (só DEVELOPER)
 *
 * AULA: @Transactional
 * =====================
 * Transação = operação que deve ser "tudo ou nada".
 *
 * Exemplo:
 *   No método register(), criamos:
 *   1. A clínica
 *   2. O usuário admin
 *
 *   Se o passo 2 falhar, o passo 1 deve ser DESFEITO.
 *   Não queremos uma clínica sem admin!
 *
 *   @Transactional garante isso automaticamente.
 *   Se qualquer coisa lançar uma Exception, TUDO é revertido (rollback).
 *
 * AULA: @Transactional(readOnly = true)
 * ======================================
 * Para operações de só-leitura (findAll, findById), usamos readOnly=true.
 * Isso melhora performance: o banco não prepara mecanismos de rollback.
 * ================================================================
 */

import com.lumay.odontologia.application.dto.ClinicDTO;
import com.lumay.odontologia.domain.exception.BusinessException;
import com.lumay.odontologia.domain.exception.ConflictException;
import com.lumay.odontologia.domain.exception.ResourceNotFoundException;
import com.lumay.odontologia.domain.model.Clinic;
import com.lumay.odontologia.domain.model.User;
import com.lumay.odontologia.domain.repository.ClinicRepository;
import com.lumay.odontologia.domain.repository.UserRepository;
import com.lumay.odontologia.infrastructure.security.context.CurrentUserService;
import com.lumay.odontologia.infrastructure.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicUseCase {

    // Injeção de dependência via construtor (o @RequiredArgsConstructor faz isso)
    private final ClinicRepository clinicRepository;
    private final UserRepository   userRepository;
    private final PasswordEncoder  passwordEncoder;  // BCrypt para hash de senha
    private final JwtService       jwtService;        // gera token JWT
    private final CurrentUserService currentUserService;

    /**
     * AUTO-CADASTRO: Registra uma nova clínica + o admin dela.
     *
     * AULA: Este é o único endpoint público (sem login) para criação.
     * Qualquer pessoa pode chamar esse endpoint e criar sua clínica.
     *
     * O que acontece aqui:
     *   1. Verifica se o slug já existe
     *   2. Verifica se o email já existe
     *   3. Cria a clínica
     *   4. Cria o admin com senha hasheada
     *   5. Gera token JWT (para o admin já ficar logado)
     *   6. Retorna tudo
     *
     * @Transactional = se qualquer passo falhar, tudo é desfeito
     */
    @Transactional
    public ClinicDTO.RegisterResponse register(ClinicDTO.RegisterRequest req) {

        // Verificação 1: slug único
        // slug é o "nome de domínio" da clínica
        if (clinicRepository.existsBySlug(req.getClinicSlug())) {
            throw new ConflictException(
                "Este slug já está em uso: " + req.getClinicSlug() +
                ". Tente algo como: " + req.getClinicSlug() + "-2"
            );
        }

        // Verificação 2: email do admin único
        if (userRepository.existsByEmail(req.getAdminEmail())) {
            throw new ConflictException("Este email já está cadastrado: " + req.getAdminEmail());
        }

        // Passo 1: cria a clínica usando o factory method do domínio
        // Toda validação de regra de negócio acontece dentro de Clinic.create()
        Clinic clinic = Clinic.create(
                req.getClinicName(),
                req.getClinicSlug(),
                req.getClinicEmail(),
                req.getClinicPhone()
        );
        clinic = clinicRepository.save(clinic); // salva e pega de volta com o ID gerado

        log.info("Nova clínica criada: {} (slug: {})", clinic.getName(), clinic.getSlug());

        // Passo 2: cria o admin da clínica
        // passwordEncoder.encode() converte a senha em hash BCrypt
        // NUNCA guarde senhas em texto puro! Sempre use hash.
        String hashedPassword = passwordEncoder.encode(req.getAdminPassword());

        User admin = User.create(
                req.getAdminName(),
                req.getAdminEmail(),
                hashedPassword,
                User.UserRole.ADMIN,
                clinic.getId()  // vincula ao id da clínica recém-criada
        );
        admin = userRepository.save(admin);

        log.info("Admin criado: {} para clínica {}", admin.getEmail(), clinic.getSlug());

        // Passo 3: gera token JWT para login imediato
        String token = jwtService.generateToken(
                admin.getEmail(),
                admin.getRole().name(),
                admin.getClinicId()
        );

        // Monta e retorna a resposta
        return ClinicDTO.RegisterResponse.builder()
                .clinic(toResponse(clinic))
                .token(token)
                .adminEmail(admin.getEmail())
                .message("Clínica criada com sucesso! Você já está logado.")
                .build();
    }

    /**
     * Atualiza dados de uma clínica.
     * Apenas ADMIN da clínica ou DEVELOPER podem fazer isso.
     */
    @Transactional
    public ClinicDTO.Response update(Long clinicId, ClinicDTO.UpdateRequest req) {

        // Verifica se o usuário logado tem acesso a esta clínica
        currentUserService.assertAccessToClinic(clinicId);
        currentUserService.assertAdminOrAbove();

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicId));

        // Chama o método de atualização do domínio (com validações embutidas)
        clinic.updateInfo(req.getName(), req.getEmail(), req.getPhone(), req.getAddress());
        clinic = clinicRepository.save(clinic);

        return toResponse(clinic);
    }

    /**
     * Lista TODAS as clínicas ativas.
     * APENAS DEVELOPER pode chamar este método.
     *
     * @Transactional(readOnly = true) = só-leitura, mais performático
     */
    @Transactional(readOnly = true)
    public List<ClinicDTO.Response> findAll() {
        // Verifica se é DEVELOPER
        User currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isDeveloper()) {
            throw new BusinessException("Apenas o desenvolvedor pode listar todas as clínicas.", 403);
        }

        return clinicRepository.findAllActive().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Busca uma clínica por ID.
     * DEVELOPER vê qualquer uma; ADMIN só vê a sua.
     */
    @Transactional(readOnly = true)
    public ClinicDTO.Response findById(Long clinicId) {
        currentUserService.assertAccessToClinic(clinicId);

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicId));

        return toResponse(clinic);
    }

    /**
     * Converte Clinic (domínio) → ClinicDTO.Response (para o frontend).
     *
     * AULA: "private" = só esta classe usa.
     * "this::" = referência a método desta instância.
     */
    private ClinicDTO.Response toResponse(Clinic c) {
        return ClinicDTO.Response.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .plan(c.getPlan())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
