package com.lumay.odontologia.infrastructure.persistence.entity;

/*
 * ================================================================
 * AULA: O QUE É UMA ENTITY (ENTIDADE JPA)?
 * ================================================================
 *
 * Entity = classe Java que mapeia para uma tabela do banco de dados.
 * Cada objeto ClinicEntity = uma linha na tabela "clinics".
 *
 * DIFERENÇA IMPORTANTE:
 *   Clinic.java (domain)    = lógica de negócio, não conhece banco
 *   ClinicEntity.java (jpa) = só existe para falar com o banco
 *
 * Por que ter dois? (parece redundante, mas tem motivo)
 *   - Separação de responsabilidades
 *   - Se mudar o banco, só muda o Entity, não o domínio
 *   - O domínio é "puro" e testável sem banco
 *
 * ANOTAÇÕES JPA (o que cada uma faz):
 *   @Entity         = "Esta classe é uma tabela no banco"
 *   @Table          = "O nome da tabela é 'clinics'"
 *   @Id             = "Este campo é a chave primária (PK)"
 *   @GeneratedValue = "O banco gera o valor automaticamente"
 *   @Column         = "Configurações desta coluna"
 *   @Enumerated     = "Esta coluna é um enum (lista fechada)"
 * ================================================================
 */

import com.lumay.odontologia.domain.model.Clinic.ClinicPlan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// @Entity diz ao Spring: "use o JPA para mapear esta classe com o banco"
@Entity
// @Table define qual tabela no banco corresponde a esta classe
@Table(
        name = "clinics",
        indexes = {
                @Index(name = "idx_clinics_slug",   columnList = "slug"),
                @Index(name = "idx_clinics_active", columnList = "active")
        }
)
// Lombok: @Getter e @Setter geram os métodos get/set automaticamente
// @Builder: padrão builder (Clinic.builder().name("x").build())
// @NoArgsConstructor: construtor vazio (JPA exige isso)
// @AllArgsConstructor: construtor com todos os campos (Builder precisa)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ClinicEntity {

    // @Id = chave primária
    // @GeneratedValue com SEQUENCE = usa a sequence do PostgreSQL para gerar IDs
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "clinics_seq")
    @SequenceGenerator(name = "clinics_seq", sequenceName = "clinics_id_seq", allocationSize = 1)
    private Long id;

    // nullable = false → NOT NULL no banco
    // length = 255 → VARCHAR(255)
    @Column(nullable = false, length = 255)
    private String name;

    // unique = true → UNIQUE no banco (dois clínicas não podem ter o mesmo slug)
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String address;

    // @Enumerated(EnumType.STRING) = guarda "BASIC", "PRO", "ENTERPRISE" como texto
    // (não como número — STRING é mais legível no banco)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default  // necessário para que o @Builder use esse valor padrão
    private ClinicPlan plan = ClinicPlan.BASIC;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    // @CreationTimestamp = Hibernate preenche automaticamente ao INSERT
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // @UpdateTimestamp = Hibernate atualiza automaticamente ao UPDATE
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
