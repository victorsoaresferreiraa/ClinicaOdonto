package com.lumay.odontologia.domain.repository;

import com.lumay.odontologia.domain.model.Appointment;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Contrato de acesso a dados de Agendamentos.
 * Todos os métodos filtram por clinicId.
 */
public interface AppointmentRepository {
    Appointment save(Appointment appointment);
    Optional<Appointment> findById(Long id);
    List<Appointment> findByPatientIdAndClinicId(Long patientId, Long clinicId);
    boolean hasConflict(Long patientId, LocalDateTime start, LocalDateTime end, Long excludeId, Long clinicId);
    List<Appointment> findByDateRangeAndClinicId(LocalDateTime start, LocalDateTime end, Long clinicId);
    void deleteById(Long id);
}
