package com.lumay.odontologia.infrastructure.persistence.entity;

/*
 * ================================================================
 * AULA: USER ENTITY — ATUALIZADO COM CLINIC_ID
 * ================================================================
 *
 * O que mudou:
 * - Adicionamos a coluna clinic_id (chave estrangeira para clinics)
 * - Adicionamos a role DEVELOPER no enum
 * - clinic_id é nullable porque DEVELOPER não tem clínica
 *
 * AULA: Chave Estrangeira (Foreign Key)
 *   Quando clinicId aponta para clinics.id, o banco garante que
 *   você não pode colocar um clinicId que não existe.
 *   Ex: se clinic com id=99 não existe, você não pode criar um
 *   user com clinicId=99. O banco bloqueia.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.User.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_email",  columnList = "email"),
                @Index(name = "idx_users_clinic", columnList = "clinic_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "users_seq")
    @SequenceGenerator(name = "users_seq", sequenceName = "users_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    /*
     * clinic_id é opcional (nullable = true é o padrão quando não declaramos nullable=false).
     * DEVELOPER tem clinic_id = NULL.
     * Todos os outros DEVEM ter um clinic_id.
     *
     * AULA: Não colocamos @ManyToOne aqui de propósito.
     * Por quê? Para manter o entity simples — só guardamos o ID da clínica,
     * não carregamos o objeto Clinic inteiro a cada query de User.
     * Isso é mais performático e mais simples.
     */
    @Column(name = "clinic_id")
    private Long clinicId;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
