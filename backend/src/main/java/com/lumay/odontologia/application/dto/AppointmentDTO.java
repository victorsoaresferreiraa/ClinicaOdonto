package com.lumay.odontologia.application.dto;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.lumay.odontologia.domain.model.Appointment.AppointmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

public class AppointmentDTO {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message="Paciente é obrigatório.") private Long patientId;
        @NotNull @Future @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime startDateTime;
        @NotNull @Future @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime endDateTime;
        @NotBlank(message="Procedimento é obrigatório.") private String procedure;
        private String notes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long id; private Long patientId; private String patientName;
        @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime startDateTime;
        @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime endDateTime;
        private String procedure; private String notes; private AppointmentStatus status;
        @JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime createdAt;
    }
}
