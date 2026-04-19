package com.lumay.odontologia.infrastructure.persistence.adapter;

import com.lumay.odontologia.domain.model.Payment;
import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import com.lumay.odontologia.domain.repository.PaymentRepository;
import com.lumay.odontologia.infrastructure.persistence.entity.PaymentEntity;
import com.lumay.odontologia.infrastructure.persistence.repository.PaymentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PaymentPersistenceAdapter implements PaymentRepository {

    private final PaymentJpaRepository jpa;

    @Override public Payment save(Payment p) { return toDomain(jpa.save(toEntity(p))); }
    @Override public Optional<Payment> findById(Long id) { return jpa.findById(id).map(this::toDomain); }

    @Override
    public List<Payment> findByPatientIdAndClinicId(Long patientId, Long clinicId) {
        return jpa.findByPatientIdAndClinicIdOrderByDueDateDesc(patientId, clinicId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<Payment> findByStatusAndClinicId(PaymentStatus status, Long clinicId) {
        return jpa.findByStatusAndClinicIdOrderByDueDateAsc(status, clinicId).stream().map(this::toDomain).toList();
    }

    @Override
    public BigDecimal sumPaidAmountBetween(LocalDate start, LocalDate end, Long clinicId) {
        return jpa.sumPaid(start, end, clinicId);
    }

    @Override
    public BigDecimal sumPendingAmount(Long clinicId) {
        return jpa.sumPending(clinicId);
    }

    private PaymentEntity toEntity(Payment p) {
        return PaymentEntity.builder()
                .id(p.getId()).appointmentId(p.getAppointmentId())
                .patientId(p.getPatientId()).description(p.getDescription())
                .amount(p.getAmount()).discount(p.getDiscount())
                .paymentMethod(p.getPaymentMethod()).status(p.getStatus())
                .dueDate(p.getDueDate()).paidAt(p.getPaidAt()).notes(p.getNotes())
                .clinicId(p.getClinicId())   // ← novo campo
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }

    private Payment toDomain(PaymentEntity e) {
        return Payment.builder()
                .id(e.getId()).appointmentId(e.getAppointmentId())
                .patientId(e.getPatientId()).description(e.getDescription())
                .amount(e.getAmount()).discount(e.getDiscount())
                .paymentMethod(e.getPaymentMethod()).status(e.getStatus())
                .dueDate(e.getDueDate()).paidAt(e.getPaidAt()).notes(e.getNotes())
                .clinicId(e.getClinicId())   // ← novo campo
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
