package com.lumay.odontologia.domain.model;

/*
 * ================================================================
 * AULA: MODEL DO USUÁRIO — COM MULTI-CLÍNICA
 * ================================================================
 *
 * O que mudou em relação à versão anterior?
 *
 * 1. Nova role: DEVELOPER
 *    - Acessa TODAS as clínicas
 *    - Não pertence a nenhuma clínica (clinicId = null)
 *    - Só você deve ter essa role
 *
 * 2. Novo campo: clinicId
 *    - Todo usuário (exceto DEVELOPER) pertence a UMA clínica
 *    - Isso é chamado de "multi-tenancy" — cada clínica é um "tenant"
 *
 * AULA SOBRE ROLES (papéis):
 *   DEVELOPER    → o dono do sistema, vê tudo
 *   ADMIN        → administrador de UMA clínica
 *   DENTIST      → dentista daquela clínica
 *   RECEPTIONIST → recepcionista daquela clínica
 * ================================================================
 */

import com.lumay.odontologia.domain.exception.BusinessException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class User {

    private final Long id;
    private String name;
    private final String email;
    private String passwordHash;
    private UserRole role;

    /*
     * clinicId = qual clínica esse usuário pertence.
     * Para DEVELOPER, este campo é NULL (ele é "acima" das clínicas).
     * Para todos os outros, é obrigatório.
     */
    private Long clinicId;

    private boolean active;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /*
     * AULA: enum com 4 valores.
     * A ordem importa! DEVELOPER > ADMIN > DENTIST > RECEPTIONIST
     * Usamos isso para verificar permissões.
     */
    public enum UserRole {
        DEVELOPER,     // acesso total ao sistema inteiro
        ADMIN,         // admin de uma clínica específica
        DENTIST,       // dentista de uma clínica específica
        RECEPTIONIST   // recepcionista de uma clínica específica
    }

    /**
     * Cria um usuário comum (ADMIN, DENTIST ou RECEPTIONIST).
     * Sempre precisa de clinicId.
     *
     * AULA: "static" = método de fábrica, chame sem precisar de objeto existente.
     */
    public static User create(String name, String email, String passwordHash,
                               UserRole role, Long clinicId) {
        // Validações básicas
        if (name == null || name.isBlank()) {
            throw new BusinessException("Nome é obrigatório.");
        }
        if (email == null || email.isBlank()) {
            throw new BusinessException("Email é obrigatório.");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new BusinessException("Senha é obrigatória.");
        }

        // Usuários normais PRECISAM de uma clínica
        UserRole resolvedRole = (role != null) ? role : UserRole.RECEPTIONIST;
        if (resolvedRole != UserRole.DEVELOPER && clinicId == null) {
            throw new BusinessException("clinicId é obrigatório para usuários que não são DEVELOPER.");
        }

        return User.builder()
                .name(name.trim())
                .email(email.toLowerCase().trim())  // email sempre em minúsculas
                .passwordHash(passwordHash)
                .role(resolvedRole)
                .clinicId(clinicId)
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Cria a conta especial de DEVELOPER.
     * Não tem clinicId porque ele acessa tudo.
     */
    public static User createDeveloper(String name, String email, String passwordHash) {
        if (name == null || name.isBlank()) throw new BusinessException("Nome é obrigatório.");
        if (email == null || email.isBlank()) throw new BusinessException("Email é obrigatório.");

        return User.builder()
                .name(name.trim())
                .email(email.toLowerCase().trim())
                .passwordHash(passwordHash)
                .role(UserRole.DEVELOPER)
                .clinicId(null)   // null = sem clínica = acesso universal
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Verifica se este usuário é dono do sistema.
     *
     * AULA: método de instância (sem "static") — precisa de um objeto User para chamar.
     *   Ex: usuario.isDeveloper()
     */
    public boolean isDeveloper() {
        return this.role == UserRole.DEVELOPER;
    }

    /** Verifica se tem permissão de admin (DEVELOPER ou ADMIN). */
    public boolean isAdminOrAbove() {
        return this.role == UserRole.DEVELOPER || this.role == UserRole.ADMIN;
    }

    /**
     * Verifica se o usuário tem acesso a uma determinada clínica.
     * DEVELOPER: sim para qualquer clínica.
     * Outros: só se o clinicId bater.
     */
    public boolean hasAccessToClinic(Long clinicId) {
        if (this.isDeveloper()) return true;
        return clinicId != null && clinicId.equals(this.clinicId);
    }
}
