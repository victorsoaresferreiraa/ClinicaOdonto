package com.lumay.odontologia.infrastructure.persistence.entity;

/*
 * ================================================================
 * AULA: PATIENT ENTITY — ATUALIZADA COM CLINIC_ID
 * ================================================================
 *
 * O que mudou:
 *   - Adicionamos a coluna clinic_id (chave estrangeira)
 *   - Todo paciente PERTENCE a uma clínica
 *
 * AULA: Por que o paciente precisa de clinic_id?
 *
 * Imagine que a Clínica A e a Clínica B ambas têm um paciente
 * chamado "João Silva". São PESSOAS DIFERENTES, em clínicas diferentes.
 * O clinic_id garante que o João da Clínica A não aparece na Clínica B.
 *
 * Sem clinic_id: todos os pacientes de todos os sistemas ficam juntos. ❌
 * Com clinic_id: cada clínica só vê seus próprios pacientes. ✅
 * ================================================================
 */

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "patients",
        indexes = {
                @Index(name = "idx_patients_cpf",     columnList = "cpf"),
                @Index(name = "idx_patients_active",  columnList = "active"),
                @Index(name = "idx_patients_clinic",  columnList = "clinic_id")  // ← novo índice
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PatientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "patients_seq")
    @SequenceGenerator(name = "patients_seq", sequenceName = "patients_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 14)
    private String cpf;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "medical_notes", length = 1000)
    private String medicalNotes;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /*
     * clinic_id: identifica a qual clínica esse paciente pertence.
     * nullable = true por padrão (não declaramos nullable = false)
     * pois a coluna foi adicionada com ALTER TABLE (dados antigos têm null).
     * A migration V3 preenche clinic_id para todos os registros existentes.
     */
    @Column(name = "clinic_id")
    private Long clinicId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
