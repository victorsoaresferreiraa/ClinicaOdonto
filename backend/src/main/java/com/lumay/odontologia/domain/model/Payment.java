package com.lumay.odontologia.domain.model;

import com.lumay.odontologia.domain.exception.BusinessException;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class Payment {

    private final Long id;
    private final Long appointmentId;
    private final Long patientId;
    private final Long clinicId;       // ← qual clínica este pagamento pertence
    private String description;
    private BigDecimal amount;
    private BigDecimal discount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private LocalDate dueDate;
    private LocalDate paidAt;
    private String notes;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum PaymentMethod { PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO, CONVENIO, TRANSFERENCIA }
    public enum PaymentStatus  { PENDING, PAID, OVERDUE, REFUNDED, CANCELLED }

    public BigDecimal getFinalAmount() {
        if (discount == null || discount.compareTo(BigDecimal.ZERO) == 0) return amount;
        return amount.subtract(discount);
    }

    public static Payment create(Long appointmentId, Long patientId, String description,
                                  BigDecimal amount, PaymentMethod method, LocalDate dueDate, Long clinicId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new BusinessException("Valor deve ser maior que zero.");
        if (dueDate == null) throw new BusinessException("Data de vencimento é obrigatória.");
        if (clinicId == null) throw new BusinessException("Clínica é obrigatória.");

        return Payment.builder()
                .appointmentId(appointmentId).patientId(patientId).clinicId(clinicId)
                .description(description).amount(amount).discount(BigDecimal.ZERO)
                .paymentMethod(method).status(PaymentStatus.PENDING).dueDate(dueDate)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
    }

    public void markAsPaid(LocalDate date) {
        if (status == PaymentStatus.PAID) throw new BusinessException("Já pago.");
        if (status == PaymentStatus.CANCELLED) throw new BusinessException("Cancelado.");
        this.status = PaymentStatus.PAID;
        this.paidAt = date != null ? date : LocalDate.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void applyDiscount(BigDecimal disc) {
        if (disc.compareTo(amount) > 0) throw new BusinessException("Desconto maior que o valor total.");
        this.discount = disc; this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        if (status == PaymentStatus.PAID) throw new BusinessException("Para cancelar pagamento pago, use estorno.");
        this.status = PaymentStatus.CANCELLED; this.updatedAt = LocalDateTime.now();
    }
}
