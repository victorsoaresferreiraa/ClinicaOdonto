package com.lumay.odontologia.infrastructure.security.context;

/*
 * ================================================================
 * AULA: COMO SABER QUEM ESTÁ LOGADO AGORA?
 * ================================================================
 *
 * Este é um dos conceitos mais importantes para o multi-tenant!
 *
 * Quando um request chega, o JwtAuthFilter lê o token JWT e
 * coloca as informações do usuário no "SecurityContext".
 *
 * SecurityContext = memória temporária do request atual.
 * É como um post-it que dura só durante esse request.
 *
 * Depois, qualquer classe pode perguntar:
 *   "Ei, quem está fazendo esse request agora?"
 *
 * É exatamente isso que o CurrentUserService faz!
 *
 * FLUXO COMPLETO:
 *   1. Request chega com header: Authorization: Bearer abc123...
 *   2. JwtAuthFilter lê o token, extrai email e role
 *   3. Coloca no SecurityContext
 *   4. UseCase chama currentUserService.getCurrentUser()
 *   5. Busca o usuário no banco pelo email
 *   6. Sabe o clinicId, a role, etc.
 *   7. Filtra os dados por clinicId
 * ================================================================
 */

import com.lumay.odontologia.domain.exception.BusinessException;
import com.lumay.odontologia.domain.model.User;
import com.lumay.odontologia.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

// @Slf4j = Lombok gera um logger chamado "log"
// Uso: log.info("mensagem"), log.warn("aviso"), log.error("erro")
@Slf4j
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    /**
     * Retorna o usuário que está logado AGORA.
     *
     * AULA: Toda vez que um request chega ao backend:
     *   1. O JwtAuthFilter colocou o email no SecurityContext
     *   2. Aqui, pegamos esse email
     *   3. Buscamos o usuário completo no banco
     *   4. Retornamos para quem precisar
     *
     * @throws BusinessException se não houver usuário logado
     */
    public User getCurrentUser() {
        // Pega a autenticação do contexto de segurança do Spring
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException("Usuário não autenticado.", 401);
        }

        // O "principal" (sujeito) é o email — colocado pelo JwtAuthFilter
        String email = auth.getName();

        // Busca o usuário no banco pelo email
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Usuário autenticado não encontrado.", 401));
    }

    /**
     * Pega o clinicId do usuário logado.
     * Se for DEVELOPER, retorna null (ele vê tudo).
     */
    public Long getCurrentClinicId() {
        User user = getCurrentUser();
        return user.getClinicId(); // null para DEVELOPER
    }

    /**
     * Verifica se o usuário logado pode acessar dados da clinicId informada.
     * DEVELOPER → sempre pode
     * Outros    → só se for a mesma clínica
     */
    public void assertAccessToClinic(Long clinicId) {
        User user = getCurrentUser();
        if (!user.hasAccessToClinic(clinicId)) {
            log.warn("Usuário {} tentou acessar clínica {} sem permissão",
                    user.getEmail(), clinicId);
            throw new BusinessException("Acesso negado a esta clínica.", 403);
        }
    }

    /**
     * Verifica se o usuário logado é ADMIN ou DEVELOPER.
     */
    public void assertAdminOrAbove() {
        User user = getCurrentUser();
        if (!user.isAdminOrAbove()) {
            throw new BusinessException("Apenas administradores podem realizar esta ação.", 403);
        }
    }
}
