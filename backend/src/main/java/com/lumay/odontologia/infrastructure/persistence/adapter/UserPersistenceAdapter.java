package com.lumay.odontologia.infrastructure.persistence.adapter;

/*
 * ================================================================
 * AULA: USER PERSISTENCE ADAPTER — ATUALIZADO
 * ================================================================
 * Adicionamos suporte a clinicId no mapeamento toDomain/toEntity.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.User;
import com.lumay.odontologia.domain.repository.UserRepository;
import com.lumay.odontologia.infrastructure.persistence.entity.UserEntity;
import com.lumay.odontologia.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserRepository {

    private final UserJpaRepository jpa;

    @Override
    public User save(User u) {
        return toDomain(jpa.save(toEntity(u)));
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        // email sempre em minúsculas no banco
        return jpa.findByEmail(email.toLowerCase()).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpa.existsByEmail(email.toLowerCase());
    }

    @Override
    public List<User> findAllByClinicId(Long clinicId) {
        return jpa.findAllByClinicIdOrderByName(clinicId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<User> findAll() {
        return jpa.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    // Entity → Domain
    private User toDomain(UserEntity e) {
        return User.builder()
                .id(e.getId())
                .name(e.getName())
                .email(e.getEmail())
                .passwordHash(e.getPasswordHash())
                .role(e.getRole())
                .clinicId(e.getClinicId())  // ← novo campo
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    // Domain → Entity
    private UserEntity toEntity(User u) {
        return UserEntity.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .passwordHash(u.getPasswordHash())
                .role(u.getRole())
                .clinicId(u.getClinicId())  // ← novo campo
                .active(u.isActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
