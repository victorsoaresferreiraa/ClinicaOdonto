package com.lumay.odontologia.application.usecase;

import com.lumay.odontologia.application.dto.PaymentDTO;
import com.lumay.odontologia.domain.exception.ResourceNotFoundException;
import com.lumay.odontologia.domain.model.Payment;
import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import com.lumay.odontologia.domain.repository.*;
import com.lumay.odontologia.infrastructure.security.context.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentUseCase {

    private final PaymentRepository  repo;
    private final PatientRepository  patientRepo;
    private final CurrentUserService currentUserService;

    @Transactional
    public PaymentDTO.Response create(PaymentDTO.CreateRequest req) {
        Long clinicId = currentUserService.getCurrentClinicId();

        var patient = patientRepo.findById(req.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", req.getPatientId()));

        currentUserService.assertAccessToClinic(patient.getClinicId());

        Payment p = Payment.create(req.getAppointmentId(), req.getPatientId(),
                req.getDescription(), req.getAmount(), req.getPaymentMethod(),
                req.getDueDate(), clinicId);

        if (req.getDiscount() != null && req.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            p.applyDiscount(req.getDiscount());
        }
        return toResponse(repo.save(p), patient.getName());
    }

    @Transactional(readOnly = true)
    public PaymentDTO.Response findById(Long id) {
        Payment p = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pagamento", id));
        currentUserService.assertAccessToClinic(p.getClinicId());
        String name = patientRepo.findById(p.getPatientId()).map(pt -> pt.getName()).orElse("");
        return toResponse(p, name);
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO.Response> findByPatient(Long patientId) {
        Long clinicId = currentUserService.getCurrentClinicId();
        patientRepo.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
        return repo.findByPatientIdAndClinicId(patientId, clinicId).stream()
                .map(p -> toResponse(p, "")).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO.Response> findByStatus(PaymentStatus status) {
        Long clinicId = currentUserService.getCurrentClinicId();
        return repo.findByStatusAndClinicId(status, clinicId).stream()
                .map(p -> toResponse(p, patientRepo.findById(p.getPatientId()).map(pt -> pt.getName()).orElse("")))
                .toList();
    }

    @Transactional
    public PaymentDTO.Response markAsPaid(Long id, PaymentDTO.MarkAsPaidRequest req) {
        Payment p = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pagamento", id));
        currentUserService.assertAccessToClinic(p.getClinicId());
        p.markAsPaid(req != null ? req.getPaidAt() : null);
        Payment updated = repo.save(p);
        String name = patientRepo.findById(updated.getPatientId()).map(pt -> pt.getName()).orElse("");
        return toResponse(updated, name);
    }

    @Transactional
    public PaymentDTO.Response cancel(Long id) {
        Payment p = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pagamento", id));
        currentUserService.assertAccessToClinic(p.getClinicId());
        p.cancel();
        Payment updated = repo.save(p);
        String name = patientRepo.findById(updated.getPatientId()).map(pt -> pt.getName()).orElse("");
        return toResponse(updated, name);
    }

    private PaymentDTO.Response toResponse(Payment p, String patientName) {
        return PaymentDTO.Response.builder()
                .id(p.getId()).appointmentId(p.getAppointmentId())
                .patientId(p.getPatientId()).patientName(patientName)
                .description(p.getDescription()).amount(p.getAmount())
                .discount(p.getDiscount()).finalAmount(p.getFinalAmount())
                .paymentMethod(p.getPaymentMethod()).status(p.getStatus())
                .dueDate(p.getDueDate()).paidAt(p.getPaidAt()).notes(p.getNotes())
                .createdAt(p.getCreatedAt()).build();
    }
}
