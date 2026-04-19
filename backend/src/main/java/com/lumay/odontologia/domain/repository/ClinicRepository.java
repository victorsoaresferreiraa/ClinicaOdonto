package com.lumay.odontologia.domain.repository;

/*
 * ================================================================
 * AULA: O QUE É UM REPOSITORY (REPOSITÓRIO)?
 * ================================================================
 *
 * Um Repository é uma "promessa" de operações de banco de dados.
 * Mas ele não sabe COMO essas operações são feitas.
 * Ele só diz O QUE pode ser feito.
 *
 * AULA: "interface" em Java = contrato.
 *   É como um contrato de trabalho que diz:
 *   "Quem assinar este contrato DEVE implementar esses métodos."
 *
 * Quem implementa? O ClinicPersistenceAdapter (na camada infrastructure).
 * Assim, o domínio não sabe que existe JPA, PostgreSQL, etc.
 *
 * ANALOGIA:
 *   Interface  = tomada elétrica (padrão fixo)
 *   Adapter    = cabo do seu aparelho (a implementação real)
 *   Você não precisa saber como a eletricidade chega, só que funciona.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.Clinic;

import java.util.List;
import java.util.Optional;

public interface ClinicRepository {

    /**
     * Salva uma clínica (INSERT ou UPDATE automático pelo JPA).
     * Retorna a clínica salva (agora com o id gerado pelo banco).
     *
     * AULA: Por que retorna Clinic e não void?
     * Porque depois de salvar, o banco gera o ID. Queremos esse ID de volta.
     */
    Clinic save(Clinic clinic);

    /**
     * Busca uma clínica pelo ID.
     *
     * AULA: Optional<Clinic> = pode retornar uma clínica OU vazio.
     * É melhor que retornar null, porque força você a tratar o caso
     * de "não encontrado" explicitamente.
     *
     * Ex de uso:
     *   clinicRepo.findById(5L)
     *       .orElseThrow(() -> new ResourceNotFoundException(...))
     */
    Optional<Clinic> findById(Long id);

    /** Busca pelo slug (ex: "minha-clinica"). */
    Optional<Clinic> findBySlug(String slug);

    /** Lista todas as clínicas ativas. Só DEVELOPER usa isso. */
    List<Clinic> findAllActive();

    /** Verifica se já existe uma clínica com esse slug. */
    boolean existsBySlug(String slug);

    /** Verifica se já existe uma clínica com esse email. */
    boolean existsByEmail(String email);
}
