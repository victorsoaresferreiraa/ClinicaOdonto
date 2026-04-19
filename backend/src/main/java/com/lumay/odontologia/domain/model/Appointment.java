package com.lumay.odontologia.domain.model;

import com.lumay.odontologia.domain.exception.BusinessException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class Appointment {

    private final Long id;
    private final Long patientId;
    private final Long clinicId;      // ← qual clínica este agendamento pertence
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String procedure;
    private String notes;
    private AppointmentStatus status;
    private final LocalDateTime createdAt;

    public enum AppointmentStatus { SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }

    public static Appointment create(Long patientId, LocalDateTime start,
                                      LocalDateTime end, String procedure, Long clinicId) {
        if (patientId == null) throw new BusinessException("Paciente é obrigatório.");
        if (clinicId == null)  throw new BusinessException("Clínica é obrigatória.");
        if (start == null || end == null) throw new BusinessException("Datas são obrigatórias.");
        if (start.isBefore(LocalDateTime.now())) throw new BusinessException("Não é possível agendar no passado.");
        if (!end.isAfter(start)) throw new BusinessException("Fim deve ser após o início.");
        if (procedure == null || procedure.isBlank()) throw new BusinessException("Procedimento é obrigatório.");

        return Appointment.builder()
                .patientId(patientId).clinicId(clinicId)
                .startDateTime(start).endDateTime(end)
                .procedure(procedure).status(AppointmentStatus.SCHEDULED)
                .createdAt(LocalDateTime.now()).build();
    }

    public void confirm() {
        if (status != AppointmentStatus.SCHEDULED) throw new BusinessException("Só agendamentos SCHEDULED podem ser confirmados.");
        status = AppointmentStatus.CONFIRMED;
    }
    public void cancel() {
        if (status == AppointmentStatus.COMPLETED) throw new BusinessException("Consulta já realizada não pode ser cancelada.");
        if (status == AppointmentStatus.CANCELLED)  throw new BusinessException("Já cancelado.");
        status = AppointmentStatus.CANCELLED;
    }
    public void complete() {
        if (status == AppointmentStatus.CANCELLED) throw new BusinessException("Agendamento cancelado não pode ser concluído.");
        status = AppointmentStatus.COMPLETED;
    }
}
