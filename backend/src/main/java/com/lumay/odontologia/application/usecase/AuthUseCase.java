package com.lumay.odontologia.application.usecase;

/*
 * ================================================================
 * AULA: AUTH USE CASE — LÓGICA DE LOGIN E REGISTRO
 * ================================================================
 *
 * O que mudou nessa versão:
 *
 * 1. Login agora retorna clinicId e clinicSlug
 *    → O frontend sabe para qual clínica direcionar o usuário
 *
 * 2. Registro de usuário dentro de uma clínica
 *    → Só ADMIN pode registrar novos usuários na sua clínica
 *    → O novo usuário herda o clinicId do admin que está criando
 *
 * AULA: BCrypt e Hashing de Senhas
 * ==================================
 * BCrypt é um algoritmo de hash para senhas.
 * Hash = função de mão única: você transforma "senha123" em
 * "$2a$12$xyz..." mas NÃO PODE fazer o caminho inverso.
 *
 * Para verificar a senha:
 *   passwordEncoder.matches("senha123", hashNobanco)
 *   → compara internamente, retorna true ou false
 *
 * Por que não guardar a senha pura?
 * Se o banco vazar, ninguém consegue usar as senhas.
 * ================================================================
 */

import com.lumay.odontologia.application.dto.AuthDTO;
import com.lumay.odontologia.domain.exception.BusinessException;
import com.lumay.odontologia.domain.exception.ConflictException;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthUseCase {

    private final UserRepository     userRepository;
    private final ClinicRepository   clinicRepository;
    private final JwtService         jwtService;
    private final PasswordEncoder    passwordEncoder;
    private final CurrentUserService currentUserService;

    /**
     * Realiza o login do usuário.
     *
     * AULA: PASSO A PASSO DO LOGIN
     * ==============================
     * 1. Recebe email + senha em texto puro
     * 2. Busca o usuário pelo email no banco
     * 3. Verifica se está ativo
     * 4. Compara a senha com o hash do banco (BCrypt)
     * 5. Se tudo ok, gera um token JWT
     * 6. Retorna o token + dados do usuário
     *
     * Se qualquer passo falhar → lança exceção → retorna erro HTTP
     *
     * SEGURANÇA: A mensagem de erro é genérica ("Email ou senha incorretos")
     * para não revelar se o email existe ou não no sistema.
     */
    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest req) {

        // Passo 1: busca o usuário pelo email
        // Se não encontrar, lança exceção (mensagem genérica por segurança)
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException("Email ou senha incorretos.", 401));

        // Passo 2: verifica se a conta está ativa
        if (!user.isActive()) {
            throw new BusinessException("Conta desativada. Entre em contato com o administrador.", 403);
        }

        // Passo 3: verifica a senha
        // passwordEncoder.matches("senha_digitada", "hash_no_banco") → true/false
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Tentativa de login com senha incorreta para: {}", req.getEmail());
            throw new BusinessException("Email ou senha incorretos.", 401);
        }

        // Passo 4: busca dados da clínica para incluir na resposta
        // DEVELOPER não tem clínica, então clinicSlug fica null
        String clinicSlug = null;
        if (user.getClinicId() != null) {
            clinicSlug = clinicRepository.findById(user.getClinicId())
                    .map(Clinic::getSlug)  // método reference: equivale a c -> c.getSlug()
                    .orElse(null);
        }

        // Passo 5: gera o token JWT com email, role e clinicId
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getClinicId()
        );

        log.info("Login bem-sucedido: {} (role: {}, clinic: {})",
                user.getEmail(), user.getRole(), user.getClinicId());

        // Passo 6: monta e retorna a resposta
        return AuthDTO.LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400L)  // 86400 segundos = 24 horas
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .userRole(user.getRole().name())
                .clinicId(user.getClinicId())
                .clinicSlug(clinicSlug)
                .build();
    }

    /**
     * Registra um novo usuário DENTRO de uma clínica.
     * Só ADMIN pode fazer isso, e o novo usuário herda a clínica do admin.
     *
     * AULA: Herdando contexto do usuário logado.
     * O admin não pode criar um usuário em OUTRA clínica.
     * O clinicId é pego automaticamente do usuário logado.
     */
    @Transactional
    public void register(AuthDTO.RegisterRequest req) {

        // Quem está fazendo o registro?
        User currentUser = currentUserService.getCurrentUser();

        // Verifica se tem permissão
        if (!currentUser.isAdminOrAbove()) {
            throw new BusinessException("Apenas administradores podem registrar usuários.", 403);
        }

        // Email já em uso?
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email já cadastrado: " + req.getEmail());
        }

        // O novo usuário herda a clínica do admin logado
        // DEVELOPER pode criar usuário sem clínica (clinicId null)
        Long clinicId = currentUser.isDeveloper() ? null : currentUser.getClinicId();

        // Define a role (se não informada, usa RECEPTIONIST)
        User.UserRole role = (req.getRole() != null) ? req.getRole() : User.UserRole.RECEPTIONIST;

        // Não deixa criar outro DEVELOPER pelo endpoint normal
        if (role == User.UserRole.DEVELOPER) {
            throw new BusinessException("Não é possível criar conta DEVELOPER por este endpoint.", 403);
        }

        // Cria e salva o usuário
        User newUser = User.create(
                req.getName(),
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),  // hash da senha
                role,
                clinicId
        );
        userRepository.save(newUser);

        log.info("Usuário criado: {} (role: {}, clinic: {})",
                req.getEmail(), role, clinicId);
    }
}
