package com.lumay.odontologia.domain.repository;

/*
 * ================================================================
 * AULA: REPOSITORY DO USUÁRIO — ATUALIZADO PARA MULTI-CLÍNICA
 * ================================================================
 *
 * O que mudou?
 * Adicionamos métodos de busca por clínica:
 *   findAllByClinicId() — lista todos os usuários de UMA clínica
 *
 * AULA: Por que buscar por clinicId?
 * Imagine que a Clínica A tem 10 usuários e a Clínica B tem 5.
 * Quando o admin da Clínica A clica em "Ver usuários", ele deve
 * ver APENAS os 10 da clínica dele, nunca os da Clínica B.
 * Isso é isolamento de dados — a essência do multi-tenant.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

    /** Salva um usuário (INSERT ou UPDATE). */
    User save(User user);

    /** Busca por ID. */
    Optional<User> findById(Long id);

    /** Busca por email (usado no login). */
    Optional<User> findByEmail(String email);

    /** Verifica se o email já está em uso. */
    boolean existsByEmail(String email);

    /**
     * Lista todos os usuários de uma clínica específica.
     * DEVELOPER usa findAll(); usuários normais usam este método.
     */
    List<User> findAllByClinicId(Long clinicId);

    /** Lista TODOS os usuários (apenas DEVELOPER deve chamar isso). */
    List<User> findAll();
}
