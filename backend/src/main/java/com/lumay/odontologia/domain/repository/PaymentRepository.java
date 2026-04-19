package com.lumay.odontologia.domain.repository;

import com.lumay.odontologia.domain.model.Payment;
import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Contrato de acesso a dados de Pagamentos.
 * Todos os métodos filtram por clinicId.
 */
public interface PaymentRepository {
    Payment save(Payment payment);
    Optional<Payment> findById(Long id);
    List<Payment> findByPatientIdAndClinicId(Long patientId, Long clinicId);
    List<Payment> findByStatusAndClinicId(PaymentStatus status, Long clinicId);
    BigDecimal sumPaidAmountBetween(LocalDate start, LocalDate end, Long clinicId);
    BigDecimal sumPendingAmount(Long clinicId);
}
