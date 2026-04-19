package com.lumay.odontologia.application.usecase;

import com.lumay.odontologia.application.dto.AppointmentDTO;
import com.lumay.odontologia.domain.exception.*;
import com.lumay.odontologia.domain.model.Appointment;
import com.lumay.odontologia.domain.repository.*;
import com.lumay.odontologia.infrastructure.security.context.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/*
 * ================================================================
 * AULA: APPOINTMENT USE CASE — MULTI-CLÍNICA
 * ================================================================
 * Mesmo padrão do PatientUseCase:
 *   - clinicId vem sempre do usuário logado (via CurrentUserService)
 *   - Todas as queries filtram por clinicId
 *   - Antes de qualquer ação, verifica se o recurso pertence à clínica
 * ================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentUseCase {

    private final AppointmentRepository repo;
    private final PatientRepository     patientRepo;
    private final CurrentUserService    currentUserService;

    @Transactional
    public AppointmentDTO.Response create(AppointmentDTO.CreateRequest req) {
        Long clinicId = currentUserService.getCurrentClinicId();

        var patient = patientRepo.findById(req.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", req.getPatientId()));

        // Garante que o paciente pertence à mesma clínica do usuário logado
        currentUserService.assertAccessToClinic(patient.getClinicId());

        if (!patient.isActive()) throw new BusinessException("Paciente inativo.");

        if (repo.hasConflict(req.getPatientId(), req.getStartDateTime(), req.getEndDateTime(), null, clinicId)) {
            throw new ConflictException("Paciente '" + patient.getName() + "' já tem agendamento neste horário.");
        }

        Appointment saved = repo.save(
                Appointment.create(req.getPatientId(), req.getStartDateTime(),
                        req.getEndDateTime(), req.getProcedure(), clinicId)
        );
        return toResponse(saved, patient.getName());
    }

    @Transactional(readOnly = true)
    public AppointmentDTO.Response findById(Long id) {
        var a = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Agendamento", id));
        currentUserService.assertAccessToClinic(a.getClinicId());
        String name = patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse("");
        return toResponse(a, name);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> findByPatient(Long patientId) {
        Long clinicId = currentUserService.getCurrentClinicId();
        patientRepo.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
        return repo.findByPatientIdAndClinicId(patientId, clinicId).stream()
                .map(a -> toResponse(a, patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse("")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> findByRange(LocalDateTime start, LocalDateTime end) {
        Long clinicId = currentUserService.getCurrentClinicId();
        return repo.findByDateRangeAndClinicId(start, end, clinicId).stream()
                .map(a -> toResponse(a, patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse("")))
                .toList();
    }

    @Transactional
    public AppointmentDTO.Response confirm(Long id) {
        Appointment a = getAndVerify(id);
        a.confirm();
        a = repo.save(a);
        return toResponse(a, patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse(""));
    }

    @Transactional
    public AppointmentDTO.Response cancel(Long id) {
        Appointment a = getAndVerify(id);
        a.cancel();
        a = repo.save(a);
        return toResponse(a, patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse(""));
    }

    @Transactional
    public AppointmentDTO.Response complete(Long id) {
        Appointment a = getAndVerify(id);
        a.complete();
        a = repo.save(a);
        return toResponse(a, patientRepo.findById(a.getPatientId()).map(p -> p.getName()).orElse(""));
    }

    /** Busca o agendamento e verifica se pertence à clínica do usuário logado. */
    private Appointment getAndVerify(Long id) {
        Appointment a = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Agendamento", id));
        currentUserService.assertAccessToClinic(a.getClinicId());
        return a;
    }

    private AppointmentDTO.Response toResponse(Appointment a, String patientName) {
        return AppointmentDTO.Response.builder()
                .id(a.getId()).patientId(a.getPatientId()).patientName(patientName)
                .startDateTime(a.getStartDateTime()).endDateTime(a.getEndDateTime())
                .procedure(a.getProcedure()).notes(a.getNotes()).status(a.getStatus())
                .createdAt(a.getCreatedAt()).build();
    }
}
