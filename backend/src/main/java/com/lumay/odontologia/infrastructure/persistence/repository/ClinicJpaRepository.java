package com.lumay.odontologia.infrastructure.persistence.repository;

/*
 * ================================================================
 * AULA: JPA REPOSITORY — A MÁGICA DO SPRING DATA
 * ================================================================
 *
 * JpaRepository é uma interface do Spring Data JPA.
 * Você só precisa declarar a interface e o Spring gera o código real!
 *
 * JpaRepository<ClinicEntity, Long> significa:
 *   - Trabalha com a entidade ClinicEntity
 *   - A chave primária (ID) é do tipo Long
 *
 * Métodos que você GANHA DE GRAÇA (sem escrever nada):
 *   save(entity)       → INSERT ou UPDATE
 *   findById(id)       → SELECT WHERE id = ?
 *   findAll()          → SELECT * FROM clinics
 *   deleteById(id)     → DELETE WHERE id = ?
 *   existsById(id)     → SELECT COUNT(*) > 0
 *   count()            → SELECT COUNT(*)
 *
 * CONVENÇÃO DE NOMES (Spring Data):
 *   findBy + NomeDoCampo     → gera SELECT WHERE campo = ?
 *   existsBy + NomeDoCampo   → gera SELECT COUNT(*) > 0
 *   findAllBy + NomeDoCampo  → gera SELECT WHERE campo = ?
 *
 * Ex: findBySlug(String slug) → SELECT * FROM clinics WHERE slug = ?
 * O Spring lê o nome do método e gera a SQL automaticamente!
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.persistence.entity.ClinicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// @Repository marca como componente de acesso a dados
@Repository
public interface ClinicJpaRepository extends JpaRepository<ClinicEntity, Long> {

    // Spring gera: SELECT * FROM clinics WHERE slug = ?
    Optional<ClinicEntity> findBySlug(String slug);

    // Spring gera: SELECT * FROM clinics WHERE active = true ORDER BY name
    List<ClinicEntity> findByActiveTrueOrderByName();

    // Spring gera: SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END WHERE slug = ?
    boolean existsBySlug(String slug);

    // Spring gera: SELECT ... WHERE email = ?
    boolean existsByEmail(String email);
}
