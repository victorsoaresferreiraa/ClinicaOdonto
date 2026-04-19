package com.lumay.odontologia.infrastructure.persistence.repository;

/*
 * ================================================================
 * AULA: PATIENT JPA REPOSITORY — COM FILTRO POR CLÍNICA
 * ================================================================
 *
 * Todos os métodos agora recebem clinicId como parâmetro.
 * Isso garante isolamento de dados entre clínicas.
 *
 * AULA: JPQL — Java Persistence Query Language
 * =============================================
 * Alguns métodos usam @Query com JPQL.
 * JPQL é parecido com SQL, mas usa o NOME DAS CLASSES JAVA, não tabelas.
 *
 * Ex em SQL:  SELECT * FROM patients WHERE clinic_id = ? AND active = true
 * Ex em JPQL: SELECT p FROM PatientEntity p WHERE p.clinicId = :cid AND p.active = true
 *
 * Vantagem: se renomear a tabela no banco, o JPQL continua funcionando
 * porque usa o nome da classe (PatientEntity), não da tabela (patients).
 *
 * @Param("cid") mapeia o :cid do JPQL para o parâmetro do método.
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.persistence.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientJpaRepository extends JpaRepository<PatientEntity, Long> {

    // Convenção de nome: busca pelo CPF (único global, não por clínica)
    Optional<PatientEntity> findByCpf(String cpf);

    /*
     * Listar pacientes ativos de UMA clínica, em ordem alfabética.
     *
     * AULA: Duas formas de fazer o mesmo:
     *
     * 1. Convenção de nome (mais simples, sem SQL):
     *    findByActiveTrueAndClinicIdOrderByName(Long clinicId)
     *    → Spring gera: WHERE active = true AND clinic_id = ? ORDER BY name
     *
     * 2. @Query com JPQL (mais controle, mais legível para queries complexas):
     *    @Query("SELECT p FROM PatientEntity p WHERE p.active = true AND p.clinicId = :cid ORDER BY p.name")
     *
     * Aqui usamos a convenção de nome pois é simples o suficiente.
     */
    List<PatientEntity> findByActiveTrueAndClinicIdOrderByName(Long clinicId);

    /*
     * Busca por nome (parcial, case-insensitive) dentro de uma clínica.
     * "ContainingIgnoreCase" = LIKE %nome% sem diferenciar maiúsculas/minúsculas.
     */
    List<PatientEntity> findByNameContainingIgnoreCaseAndClinicId(String name, Long clinicId);

    /*
     * Verifica se CPF já existe na mesma clínica, excluindo um ID específico.
     * Usado na criação e atualização de paciente para evitar CPF duplicado.
     *
     * @Query necessária pois a lógica (IS NULL OR ...) não tem convenção de nome.
     *
     * AULA: :cpf, :cid, :id são parâmetros nomeados.
     * Muito mais legível do que ? com posição.
     */
    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM PatientEntity p
            WHERE p.cpf = :cpf
              AND p.clinicId = :cid
              AND (:id IS NULL OR p.id != :id)
            """)
    boolean existsByCpfAndClinicIdAndIdNot(
            @Param("cpf") String cpf,
            @Param("cid") Long clinicId,
            @Param("id")  Long excludeId
    );
}
