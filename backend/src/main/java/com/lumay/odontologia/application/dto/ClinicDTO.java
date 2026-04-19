package com.lumay.odontologia.application.dto;

/*
 * ================================================================
 * AULA: O QUE É UM DTO (Data Transfer Object)?
 * ================================================================
 *
 * DTO = objeto criado SÓ para transferir dados entre camadas.
 *
 * Por que não usar o próprio domínio (Clinic.java)?
 * - O frontend não precisa de todos os campos do domínio
 * - O domínio pode ter campos sensíveis (senha, hash, etc.)
 * - Podemos validar os dados de entrada separadamente
 *
 * ESTRUTURA DESTE DTO:
 *   RegisterRequest  = dados para cadastrar uma nova clínica + admin
 *   UpdateRequest    = dados para atualizar uma clínica
 *   Response         = dados que voltam para o frontend
 *
 * ANOTAÇÕES DE VALIDAÇÃO (@NotBlank, @Email, etc.):
 *   @NotBlank  = campo não pode ser vazio ou null
 *   @Email     = deve ser um email válido
 *   @Size      = limita o tamanho do texto
 *   @Pattern   = valida com expressão regular (regex)
 *
 * Se as validações falharem, o Spring retorna automaticamente
 * um erro 422 com as mensagens. Você não precisa checar manualmente!
 * ================================================================
 */

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.lumay.odontologia.domain.model.Clinic.ClinicPlan;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class ClinicDTO {

    /**
     * Dados para AUTO-CADASTRO de uma nova clínica.
     *
     * Este é o endpoint público que qualquer pessoa usa para criar
     * sua clínica e sua conta de admin ao mesmo tempo.
     *
     * AULA: "static class" dentro de outra class = "classe interna".
     * Usamos isso para organizar os DTOs em um único arquivo.
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {

        // --- Dados da CLÍNICA ---

        @NotBlank(message = "Nome da clínica é obrigatório.")
        @Size(min = 2, max = 255, message = "Nome deve ter entre 2 e 255 caracteres.")
        private String clinicName;

        /**
         * Slug é o "apelido" da clínica para URLs.
         * Deve ter só letras minúsculas, números e hífens.
         * Ex: "clinica-sorriso-sp", "odonto-center-rj"
         *
         * AULA: @Pattern valida com expressão regular (regex).
         * "^[a-z0-9-]{3,100}$" significa:
         *   ^         = início da string
         *   [a-z0-9-] = só letras minúsculas, números ou hífen
         *   {3,100}   = entre 3 e 100 caracteres
         *   $         = fim da string
         */
        @NotBlank(message = "Slug é obrigatório.")
        @Pattern(
                regexp = "^[a-z0-9-]{3,100}$",
                message = "Slug deve conter apenas letras minúsculas, números e hífens (ex: minha-clinica)."
        )
        private String clinicSlug;

        @Email(message = "Email da clínica inválido.")
        private String clinicEmail;

        private String clinicPhone;

        // --- Dados do ADMIN da clínica ---

        @NotBlank(message = "Seu nome é obrigatório.")
        @Size(min = 2, max = 255)
        private String adminName;

        @NotBlank(message = "Seu email é obrigatório.")
        @Email(message = "Email inválido.")
        private String adminEmail;

        @NotBlank(message = "Senha é obrigatória.")
        @Size(min = 8, message = "Senha deve ter pelo menos 8 caracteres.")
        private String adminPassword;
    }

    /** Dados para atualizar uma clínica existente. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRequest {

        @NotBlank(message = "Nome é obrigatório.")
        @Size(min = 2, max = 255)
        private String name;

        @Email
        private String email;

        private String phone;
        private String address;
    }

    /**
     * O que o backend RETORNA para o frontend.
     *
     * AULA: @JsonInclude(NON_NULL) = campos null não aparecem no JSON.
     * Ex: se address for null, ele não aparece no JSON de resposta.
     * Isso deixa o JSON menor e mais limpo.
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id;
        private String name;
        private String slug;
        private String email;
        private String phone;
        private String address;
        private ClinicPlan plan;
        private boolean active;

        // @JsonFormat define como a data aparece no JSON
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
    }

    /**
     * Resposta especial para o auto-cadastro.
     * Retorna os dados da clínica criada + token de acesso imediato.
     * Assim o usuário já fica logado após se cadastrar!
     */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterResponse {
        private Response clinic;
        private String token;         // JWT para login imediato
        private String adminEmail;
        private String message;       // mensagem amigável
    }
}
