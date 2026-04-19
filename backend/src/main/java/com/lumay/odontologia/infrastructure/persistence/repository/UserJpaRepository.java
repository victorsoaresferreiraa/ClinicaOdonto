package com.lumay.odontologia.infrastructure.persistence.repository;

/*
 * ================================================================
 * AULA: USER JPA REPOSITORY — ATUALIZADO
 * ================================================================
 *
 * Adicionamos findAllByClinicId para buscar usuários de uma clínica.
 *
 * LEMBRE-SE da convenção de nomes:
 *   findAllByClinicId → SELECT * FROM users WHERE clinic_id = ?
 *
 * O Spring gera isso automaticamente! Não precisa escrever SQL.
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    // Usado no login: busca usuário pelo email
    Optional<UserEntity> findByEmail(String email);

    // Verifica se email já está cadastrado
    boolean existsByEmail(String email);

    // Lista usuários de uma clínica específica
    // Spring gera: SELECT * FROM users WHERE clinic_id = ? ORDER BY name
    List<UserEntity> findAllByClinicIdOrderByName(Long clinicId);
}
