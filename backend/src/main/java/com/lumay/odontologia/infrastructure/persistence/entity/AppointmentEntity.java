package com.lumay.odontologia.infrastructure.persistence.entity;

import com.lumay.odontologia.domain.model.Appointment.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "appointments",
        indexes = {
                @Index(name = "idx_appt_patient", columnList = "patient_id"),
                @Index(name = "idx_appt_start",   columnList = "start_date_time"),
                @Index(name = "idx_appt_clinic",  columnList = "clinic_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AppointmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "appt_seq")
    @SequenceGenerator(name = "appt_seq", sequenceName = "appointments_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "start_date_time", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time", nullable = false)
    private LocalDateTime endDateTime;

    @Column(name = "procedure_name", nullable = false, length = 255)
    private String procedure;

    @Column(length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status;

    // Clínica a qual este agendamento pertence
    @Column(name = "clinic_id")
    private Long clinicId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
