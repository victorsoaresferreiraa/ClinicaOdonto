package com.lumay.odontologia.infrastructure.persistence.adapter;

import com.lumay.odontologia.domain.model.Patient;
import com.lumay.odontologia.domain.repository.PatientRepository;
import com.lumay.odontologia.infrastructure.persistence.entity.PatientEntity;
import com.lumay.odontologia.infrastructure.persistence.repository.PatientJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PatientPersistenceAdapter implements PatientRepository {

    private final PatientJpaRepository jpa;

    @Override public Patient save(Patient p) { return toDomain(jpa.save(toEntity(p))); }
    @Override public Optional<Patient> findById(Long id) { return jpa.findById(id).map(this::toDomain); }
    @Override public Optional<Patient> findByCpf(String cpf) { return jpa.findByCpf(cpf).map(this::toDomain); }

    @Override
    public List<Patient> findAllActiveByClinicId(Long clinicId) {
        return jpa.findByActiveTrueAndClinicIdOrderByName(clinicId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<Patient> findByNameContainingAndClinicId(String name, Long clinicId) {
        return jpa.findByNameContainingIgnoreCaseAndClinicId(name, clinicId).stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsByCpfAndClinicIdAndIdNot(String cpf, Long clinicId, Long excludeId) {
        return jpa.existsByCpfAndClinicIdAndIdNot(cpf, clinicId, excludeId);
    }

    @Override public void deleteById(Long id) { jpa.deleteById(id); }

    private PatientEntity toEntity(Patient p) {
        return PatientEntity.builder()
                .id(p.getId()).name(p.getName()).cpf(p.getCpf())
                .email(p.getEmail()).phone(p.getPhone()).birthDate(p.getBirthDate())
                .medicalNotes(p.getMedicalNotes()).active(p.isActive())
                .clinicId(p.getClinicId())           // ← novo campo
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }

    private Patient toDomain(PatientEntity e) {
        return Patient.builder()
                .id(e.getId()).name(e.getName()).cpf(e.getCpf())
                .email(e.getEmail()).phone(e.getPhone()).birthDate(e.getBirthDate())
                .medicalNotes(e.getMedicalNotes()).active(e.isActive())
                .clinicId(e.getClinicId())           // ← novo campo
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
