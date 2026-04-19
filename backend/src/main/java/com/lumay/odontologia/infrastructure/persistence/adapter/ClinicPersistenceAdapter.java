package com.lumay.odontologia.infrastructure.persistence.adapter;

/*
 * ================================================================
 * AULA: O QUE É UM ADAPTER (ADAPTADOR)?
 * ================================================================
 *
 * O Adapter faz a ponte entre o mundo do domínio e o mundo do banco.
 *
 * PROBLEMA: O domínio usa Clinic.java, mas o JPA precisa de ClinicEntity.java.
 * São duas classes diferentes com o mesmo dado!
 *
 * SOLUÇÃO: O Adapter converte uma na outra.
 *   toDomain(entity)  → ClinicEntity → Clinic
 *   toEntity(domain)  → Clinic → ClinicEntity
 *
 * Por que esse trabalho todo?
 * Para que o domínio não dependa do JPA.
 * Amanhã, se trocar de JPA para MongoDB, só muda o Adapter.
 * O domínio (Clinic, ClinicRepository) não muda nada.
 *
 * PADRÃO: "implements ClinicRepository"
 * Isso significa que ClinicPersistenceAdapter ASSINA o CONTRATO
 * definido pela interface ClinicRepository.
 * ================================================================
 */

import com.lumay.odontologia.domain.model.Clinic;
import com.lumay.odontologia.domain.repository.ClinicRepository;
import com.lumay.odontologia.infrastructure.persistence.entity.ClinicEntity;
import com.lumay.odontologia.infrastructure.persistence.repository.ClinicJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

// @Component = "Spring, gerencie esta classe para mim (injete onde precisar)"
// @RequiredArgsConstructor = Lombok gera construtor com todos os campos "final"
@Component
@RequiredArgsConstructor
public class ClinicPersistenceAdapter implements ClinicRepository {

    // O Spring injeta automaticamente uma instância do JpaRepository
    // AULA: "final" + @RequiredArgsConstructor = injeção de dependência via construtor
    private final ClinicJpaRepository jpa;

    @Override
    public Clinic save(Clinic clinic) {
        // 1. Converte o objeto de domínio para entidade JPA
        // 2. Salva no banco via JPA
        // 3. Converte o resultado de volta para domínio (agora com ID)
        return toDomain(jpa.save(toEntity(clinic)));
    }

    @Override
    public Optional<Clinic> findById(Long id) {
        // jpa.findById retorna Optional<ClinicEntity>
        // .map(this::toDomain) converte para Optional<Clinic>
        // "this::toDomain" é uma referência ao método toDomain desta classe
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Clinic> findBySlug(String slug) {
        return jpa.findBySlug(slug).map(this::toDomain);
    }

    @Override
    public List<Clinic> findAllActive() {
        // .stream() = cria um "stream" (pipeline de processamento)
        // .map(this::toDomain) = aplica toDomain em cada elemento
        // .toList() = coleta o resultado em uma List
        return jpa.findByActiveTrueOrderByName().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public boolean existsBySlug(String slug) {
        return jpa.existsBySlug(slug);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpa.existsByEmail(email);
    }

    /*
     * ================================================================
     * MÉTODOS DE CONVERSÃO (MAPEAMENTO)
     * ================================================================
     *
     * AULA: Esses métodos são o "dicionário" entre as duas linguagens:
     *   - A linguagem do domínio (Clinic)
     *   - A linguagem do banco (ClinicEntity)
     *
     * "private" = só esta classe usa esses métodos.
     * ================================================================
     */

    /** Converte ClinicEntity (banco) → Clinic (domínio) */
    private Clinic toDomain(ClinicEntity e) {
        return Clinic.builder()
                .id(e.getId())
                .name(e.getName())
                .slug(e.getSlug())
                .email(e.getEmail())
                .phone(e.getPhone())
                .address(e.getAddress())
                .plan(e.getPlan())
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    /** Converte Clinic (domínio) → ClinicEntity (banco) */
    private ClinicEntity toEntity(Clinic c) {
        return ClinicEntity.builder()
                .id(c.getId())       // null se for novo (banco gera o ID)
                .name(c.getName())
                .slug(c.getSlug())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .plan(c.getPlan())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
