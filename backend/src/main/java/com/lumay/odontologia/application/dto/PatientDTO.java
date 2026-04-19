package com.lumay.odontologia.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/*
 * AULA: DTO DO PACIENTE
 * O clinicId NÃO aparece no CreateRequest (o servidor define pela sessão).
 * Isso é segurança: o usuário não pode escolher em qual clínica criar.
 */
public class PatientDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Nome é obrigatório.") @Size(min = 2, max = 255)
        private String name;

        @NotBlank(message = "CPF é obrigatório.")
        private String cpf;

        @Email(message = "Email inválido.")
        private String email;

        @Pattern(regexp = "^[0-9]{10,11}$", message = "Telefone: apenas dígitos (10 ou 11).")
        private String phone;

        @Past @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate birthDate;

        @Size(max = 1000)
        private String medicalNotes;
        // ← clinicId NÃO está aqui: é definido pelo servidor com base no usuário logado
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Nome é obrigatório.") @Size(min = 2, max = 255)
        private String name;

        @Email private String email;

        @Pattern(regexp = "^[0-9]{10,11}$", message = "Telefone: apenas dígitos.")
        private String phone;

        @Size(max = 1000)
        private String medicalNotes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id;
        private String name;
        private String cpf;
        private String email;
        private String phone;
        @JsonFormat(pattern = "yyyy-MM-dd") private LocalDate birthDate;
        private String medicalNotes;
        private boolean active;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime createdAt;
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime updatedAt;
    }
}
