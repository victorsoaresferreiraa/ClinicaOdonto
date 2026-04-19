package com.lumay.odontologia.domain.model;

/*
 * ================================================================
 * AULA: PATIENT MODEL — ATUALIZADO COM CLINIC_ID
 * ================================================================
 *
 * O que mudou:
 *   - Campo clinicId adicionado
 *   - Método create() agora recebe clinicId
 *
 * AULA: Por que cliniId no domínio e não só no banco?
 * O domínio deve refletir a realidade do negócio.
 * Na realidade, um paciente pertence a uma clínica.
 * Logo, o domínio deve expressar isso explicitamente.
 * ================================================================
 */

import com.lumay.odontologia.domain.exception.BusinessException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class Patient {

    private final Long id;
    private String name;
    private final String cpf;
    private String email;
    private String phone;
    private LocalDate birthDate;
    private String medicalNotes;
    private boolean active;
    private final Long clinicId;       // ← qual clínica este paciente pertence
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Cria um novo paciente vinculado a uma clínica.
     *
     * AULA: Note que clinicId é "final" — não pode mudar depois de criado.
     * Um paciente não "muda de clínica". Isso é uma regra de negócio.
     */
    public static Patient create(String name, String cpf, String email,
                                  String phone, LocalDate birthDate, Long clinicId) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("O nome do paciente é obrigatório.");
        }
        if (cpf == null || cpf.isBlank()) {
            throw new BusinessException("O CPF do paciente é obrigatório.");
        }
        if (clinicId == null) {
            throw new BusinessException("A clínica do paciente é obrigatória.");
        }
        return Patient.builder()
                .name(name.trim())
                .cpf(cpf.replaceAll("[^0-9]", ""))  // remove pontos e traços do CPF
                .email(email)
                .phone(phone)
                .birthDate(birthDate)
                .active(true)
                .clinicId(clinicId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public void updateInfo(String name, String email, String phone, String medicalNotes) {
        if (name == null || name.isBlank()) throw new BusinessException("O nome é obrigatório.");
        this.name = name.trim();
        this.email = email;
        this.phone = phone;
        this.medicalNotes = medicalNotes;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        if (!this.active) throw new BusinessException("Paciente já está desativado.");
        this.active = false;
        this.updatedAt = LocalDateTime.now();
    }
}
