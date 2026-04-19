package com.lumay.odontologia.application.dto;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.lumay.odontologia.domain.model.Payment.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentDTO {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        private Long appointmentId;
        @NotNull(message="Paciente é obrigatório.") private Long patientId;
        @NotBlank(message="Descrição é obrigatória.") private String description;
        @NotNull @DecimalMin("0.01") private BigDecimal amount;
        private BigDecimal discount;
        @NotNull private PaymentMethod paymentMethod;
        @NotNull @FutureOrPresent @JsonFormat(pattern="yyyy-MM-dd") private LocalDate dueDate;
        private String notes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarkAsPaidRequest {
        @JsonFormat(pattern="yyyy-MM-dd") private LocalDate paidAt;
        private PaymentMethod paymentMethod;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id; private Long appointmentId; private Long patientId; private String patientName;
        private String description; private BigDecimal amount; private BigDecimal discount;
        private BigDecimal finalAmount; private PaymentMethod paymentMethod; private PaymentStatus status;
        @JsonFormat(pattern="yyyy-MM-dd") private LocalDate dueDate;
        @JsonFormat(pattern="yyyy-MM-dd") private LocalDate paidAt;
        private String notes;
        @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime createdAt;
    }
}
