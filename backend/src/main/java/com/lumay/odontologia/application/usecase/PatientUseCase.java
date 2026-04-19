package com.lumay.odontologia.application.usecase;

/*
 * ================================================================
 * AULA: PATIENT USE CASE — ATUALIZADO PARA MULTI-CLÍNICA
 * ================================================================
 *
 * O que mudou:
 *   Antes: findAllActive() retornava TODOS os pacientes do banco.
 *   Agora: findAllActive() retorna só os pacientes da clínica logada.
 *
 * Como sabemos a clínica do usuário logado?
 * Através do CurrentUserService! Ele lê o JWT, pega o email,
 * busca o usuário no banco e retorna o clinicId.
 *
 * AULA: FLUXO DO ISOLAMENTO MULTI-TENANT
 * ========================================
 *
 * Usuário A (Clínica 1) faz GET /api/patients:
 *   1. JwtAuthFilter lê o token → coloca email no SecurityContext
 *   2. currentUserService.getCurrentClinicId() → retorna 1
 *   3. patientRepo.findAllActiveByClinicId(1) → só pacientes da Clínica 1
 *   4. Retorna apenas os pacientes da Clínica 1 ✅
 *
 * Usuário B (Clínica 2) faz GET /api/patients:
 *   1. JwtAuthFilter lê o token → coloca email no SecurityContext
 *   2. currentUserService.getCurrentClinicId() → retorna 2
 *   3. patientRepo.findAllActiveByClinicId(2) → só pacientes da Clínica 2
 *   4. Retorna apenas os pacientes da Clínica 2 ✅
 *
 * Os dados nunca se misturam. Isso é multi-tenancy! 🎉
 * ================================================================
 */

import com.lumay.odontologia.application.dto.PatientDTO;
import com.lumay.odontologia.domain.exception.ConflictException;
import com.lumay.odontologia.domain.exception.ResourceNotFoundException;
import com.lumay.odontologia.domain.model.Patient;
import com.lumay.odontologia.domain.repository.PatientRepository;
import com.lumay.odontologia.infrastructure.security.context.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientUseCase {

    private final PatientRepository  repo;
    private final CurrentUserService currentUserService;  // ← novo: pega o usuário logado

    /**
     * Cria um novo paciente.
     * O paciente herda automaticamente a clínica do usuário logado.
     *
     * AULA: Note que o clinicId NÃO vem do frontend!
     * Ele é definido pelo servidor com base em quem está logado.
     * Isso evita que um usuário mal-intencionado crie um paciente
     * na clínica errada passando um clinicId falso.
     */
    @Transactional
    public PatientDTO.Response create(PatientDTO.CreateRequest req) {

        // Pega a clínica do usuário logado (via JWT)
        Long clinicId = currentUserService.getCurrentClinicId();

        // Verifica se o CPF já existe NESTA clínica
        // (o mesmo CPF pode existir em clínicas diferentes — são pessoas distintas no sistema)
        if (repo.existsByCpfAndClinicIdAndIdNot(req.getCpf(), clinicId, null)) {
            throw new ConflictException("CPF já cadastrado nesta clínica: " + req.getCpf());
        }

        // Cria o paciente vinculado à clínica
        Patient patient = Patient.create(
                req.getName(), req.getCpf(), req.getEmail(),
                req.getPhone(), req.getBirthDate(), clinicId
        );

        // Se vieram observações médicas, recria com elas (o Builder é imutável)
        if (req.getMedicalNotes() != null) {
            patient = Patient.builder()
                    .name(patient.getName()).cpf(patient.getCpf()).email(patient.getEmail())
                    .phone(patient.getPhone()).birthDate(patient.getBirthDate())
                    .medicalNotes(req.getMedicalNotes()).active(true)
                    .clinicId(clinicId)
                    .createdAt(patient.getCreatedAt()).updatedAt(patient.getUpdatedAt()).build();
        }

        return toResponse(repo.save(patient));
    }

    /** Busca paciente por ID — verifica se pertence à clínica do usuário logado. */
    @Transactional(readOnly = true)
    public PatientDTO.Response findById(Long id) {
        Patient patient = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        // Verifica se o usuário tem acesso a esse paciente
        currentUserService.assertAccessToClinic(patient.getClinicId());

        return toResponse(patient);
    }

    /** Lista todos os pacientes ativos DA CLÍNICA DO USUÁRIO LOGADO. */
    @Transactional(readOnly = true)
    public List<PatientDTO.Response> findAllActive() {
        Long clinicId = currentUserService.getCurrentClinicId();
        return repo.findAllActiveByClinicId(clinicId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Busca pacientes por nome dentro da clínica do usuário logado. */
    @Transactional(readOnly = true)
    public List<PatientDTO.Response> findByName(String name) {
        Long clinicId = currentUserService.getCurrentClinicId();
        return repo.findByNameContainingAndClinicId(name, clinicId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza paciente. Verifica se pertence à clínica correta. */
    @Transactional
    public PatientDTO.Response update(Long id, PatientDTO.UpdateRequest req) {
        Patient patient = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        currentUserService.assertAccessToClinic(patient.getClinicId());

        patient.updateInfo(req.getName(), req.getEmail(), req.getPhone(), req.getMedicalNotes());
        return toResponse(repo.save(patient));
    }

    /** Desativa paciente (soft delete). */
    @Transactional
    public void deactivate(Long id) {
        Patient patient = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        currentUserService.assertAccessToClinic(patient.getClinicId());

        patient.deactivate();
        repo.save(patient);
    }

    /** Converte domínio → DTO de resposta. */
    private PatientDTO.Response toResponse(Patient p) {
        return PatientDTO.Response.builder()
                .id(p.getId()).name(p.getName()).cpf(p.getCpf())
                .email(p.getEmail()).phone(p.getPhone()).birthDate(p.getBirthDate())
                .medicalNotes(p.getMedicalNotes()).active(p.isActive())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }
}
