package com.lumay.odontologia.infrastructure.persistence.repository;

/*
 * ================================================================
 * AULA: PAYMENT JPA REPOSITORY — COM FILTRO POR CLÍNICA
 * ================================================================
 *
 * AULA: COALESCE no SQL
 * =====================
 * COALESCE(expr, valor_padrão) retorna o primeiro valor não-null.
 *
 * Ex: COALESCE(SUM(amount), 0)
 * → Se não houver pagamentos, SUM retorna null.
 * → COALESCE transforma null em 0.
 * → Sem isso, o Java receberia null e daria NullPointerException!
 * ================================================================
 */

import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import com.lumay.odontologia.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, Long> {

    List<PaymentEntity> findByPatientIdAndClinicIdOrderByDueDateDesc(
            Long patientId, Long clinicId
    );

    List<PaymentEntity> findByStatusAndClinicIdOrderByDueDateAsc(
            PaymentStatus status, Long clinicId
    );

    /*
     * Soma o total de pagamentos PAGOS em um período para uma clínica.
     * Usado no dashboard para mostrar a receita do mês.
     *
     * AULA: COALESCE(SUM(...), 0) → nunca retorna null, sempre retorna número.
     */
    @Query("""
            SELECT COALESCE(SUM(p.amount - p.discount), 0)
            FROM PaymentEntity p
            WHERE p.clinicId = :cid
              AND p.status   = 'PAID'
              AND p.paidAt BETWEEN :start AND :end
            """)
    BigDecimal sumPaid(
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end,
            @Param("cid")   Long clinicId
    );

    /*
     * Soma o total pendente de pagamentos para uma clínica.
     */
    @Query("""
            SELECT COALESCE(SUM(p.amount - p.discount), 0)
            FROM PaymentEntity p
            WHERE p.clinicId = :cid
              AND p.status   = 'PENDING'
            """)
    BigDecimal sumPending(@Param("cid") Long clinicId);
}
