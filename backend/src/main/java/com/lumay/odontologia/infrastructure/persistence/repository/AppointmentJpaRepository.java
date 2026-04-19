package com.lumay.odontologia.infrastructure.persistence.repository;

/*
 * ================================================================
 * AULA: APPOINTMENT JPA REPOSITORY — COM FILTRO POR CLÍNICA
 * ================================================================
 *
 * AULA: Text Blocks (Java 15+)
 * =============================
 * As aspas triplas """ permitem escrever strings em múltiplas linhas.
 * Ótimo para SQL/JPQL longos — muito mais legível!
 *
 * Sem text block:
 *   "SELECT a FROM AppointmentEntity a " +
 *   "WHERE a.clinicId = :cid " +
 *   "AND a.startDateTime >= :start"
 *
 * Com text block:
 *   """
 *   SELECT a FROM AppointmentEntity a
 *   WHERE a.clinicId = :cid
 *   AND a.startDateTime >= :start
 *   """
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.persistence.entity.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentJpaRepository extends JpaRepository<AppointmentEntity, Long> {

    // Agendamentos de um paciente em uma clínica específica
    List<AppointmentEntity> findByPatientIdAndClinicIdOrderByStartDateTimeDesc(
            Long patientId, Long clinicId
    );

    /*
     * Verifica conflito de horário DENTRO da mesma clínica.
     *
     * AULA: Lógica de sobreposição de intervalos:
     * Dois intervalos [A_start, A_end] e [B_start, B_end] se sobrepõem quando:
     *   A_start < B_end  E  A_end > B_start
     *
     * Ex: Consulta A: 10h-11h, Consulta B: 10h30-11h30 → CONFLITO
     * Ex: Consulta A: 10h-11h, Consulta B: 11h-12h     → SEM CONFLITO
     */
    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM AppointmentEntity a
            WHERE a.patientId = :pid
              AND a.clinicId  = :cid
              AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
              AND a.startDateTime < :end
              AND a.endDateTime   > :start
              AND (:excludeId IS NULL OR a.id != :excludeId)
            """)
    boolean hasConflict(
            @Param("pid")       Long patientId,
            @Param("start")     LocalDateTime start,
            @Param("end")       LocalDateTime end,
            @Param("excludeId") Long excludeId,
            @Param("cid")       Long clinicId
    );

    // Agendamentos em um intervalo de datas para uma clínica
    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.clinicId       = :cid
              AND a.startDateTime >= :start
              AND a.startDateTime <= :end
            ORDER BY a.startDateTime
            """)
    List<AppointmentEntity> findByDateRangeAndClinicId(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end,
            @Param("cid")   Long clinicId
    );
}
