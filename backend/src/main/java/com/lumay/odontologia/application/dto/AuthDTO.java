package com.lumay.odontologia.application.dto;

/*
 * ================================================================
 * AULA: AuthDTO — OBJETO DE TRANSFERÊNCIA PARA AUTENTICAÇÃO
 * ================================================================
 *
 * Este DTO cuida dos dados de login e cadastro de usuário.
 *
 * Atualização: agora inclui clinicId na resposta do login,
 * para o frontend saber a qual clínica o usuário pertence.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.User.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

public class AuthDTO {

    /**
     * Dados enviados pelo usuário para fazer login.
     *
     * AULA: O frontend envia um JSON assim:
     * {
     *   "email": "admin@clinica.com",
     *   "password": "minhasenha"
     * }
     * O Spring converte esse JSON automaticamente para LoginRequest.
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {

        @NotBlank(message = "Email é obrigatório.")
        @Email(message = "Email inválido.")
        private String email;

        @NotBlank(message = "Senha é obrigatória.")
        private String password;
    }

    /**
     * Dados para criar um novo usuário dentro de uma clínica.
     * Só ADMIN pode chamar esse endpoint.
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {

        @NotBlank(message = "Nome é obrigatório.")
        private String name;

        @NotBlank(message = "Email é obrigatório.")
        @Email
        private String email;

        @NotBlank
        @Size(min = 8, message = "Senha deve ter pelo menos 8 caracteres.")
        private String password;

        private UserRole role; // se não informado, será RECEPTIONIST
    }

    /**
     * O que o backend retorna após login bem-sucedido.
     *
     * AULA: O frontend salva esse token no localStorage.
     * Em toda request seguinte, manda no header:
     *   Authorization: Bearer {token}
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginResponse {
        private String token;       // o JWT (string longa)
        private String tokenType;   // sempre "Bearer"
        private long expiresIn;     // segundos até expirar (86400 = 24h)
        private Long userId;
        private String userName;
        private String userEmail;
        private String userRole;
        private Long clinicId;      // ← NOVO: qual clínica o usuário pertence
        private String clinicSlug;  // ← NOVO: slug da clínica (para URLs)
    }
}
