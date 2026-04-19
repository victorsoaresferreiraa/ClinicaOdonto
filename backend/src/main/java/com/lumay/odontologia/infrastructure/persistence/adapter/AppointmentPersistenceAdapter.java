package com.lumay.odontologia.infrastructure.persistence.adapter;

import com.lumay.odontologia.domain.model.Appointment;
import com.lumay.odontologia.domain.repository.AppointmentRepository;
import com.lumay.odontologia.infrastructure.persistence.entity.AppointmentEntity;
import com.lumay.odontologia.infrastructure.persistence.repository.AppointmentJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AppointmentPersistenceAdapter implements AppointmentRepository {

    private final AppointmentJpaRepository jpa;

    @Override public Appointment save(Appointment a) { return toDomain(jpa.save(toEntity(a))); }
    @Override public Optional<Appointment> findById(Long id) { return jpa.findById(id).map(this::toDomain); }

    @Override
    public List<Appointment> findByPatientIdAndClinicId(Long patientId, Long clinicId) {
        return jpa.findByPatientIdAndClinicIdOrderByStartDateTimeDesc(patientId, clinicId).stream().map(this::toDomain).toList();
    }

    @Override
    public boolean hasConflict(Long pid, LocalDateTime start, LocalDateTime end, Long excl, Long clinicId) {
        return jpa.hasConflict(pid, start, end, excl, clinicId);
    }

    @Override
    public List<Appointment> findByDateRangeAndClinicId(LocalDateTime start, LocalDateTime end, Long clinicId) {
        return jpa.findByDateRangeAndClinicId(start, end, clinicId).stream().map(this::toDomain).toList();
    }

    @Override public void deleteById(Long id) { jpa.deleteById(id); }

    private AppointmentEntity toEntity(Appointment a) {
        return AppointmentEntity.builder()
                .id(a.getId()).patientId(a.getPatientId())
                .startDateTime(a.getStartDateTime()).endDateTime(a.getEndDateTime())
                .procedure(a.getProcedure()).notes(a.getNotes()).status(a.getStatus())
                .clinicId(a.getClinicId())   // ← novo campo
                .createdAt(a.getCreatedAt()).build();
    }

    private Appointment toDomain(AppointmentEntity e) {
        return Appointment.builder()
                .id(e.getId()).patientId(e.getPatientId())
                .startDateTime(e.getStartDateTime()).endDateTime(e.getEndDateTime())
                .procedure(e.getProcedure()).notes(e.getNotes()).status(e.getStatus())
                .clinicId(e.getClinicId())   // ← novo campo
                .createdAt(e.getCreatedAt()).build();
    }
}
