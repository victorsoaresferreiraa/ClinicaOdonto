package com.lumay.odontologia.domain.repository;

import com.lumay.odontologia.domain.model.Patient;
import java.util.List;
import java.util.Optional;

/**
 * Contrato de acesso a dados de Pacientes.
 *
 * AULA: Todos os métodos de busca agora recebem clinicId.
 * Isso garante que os dados de uma clínica NUNCA vazam para outra.
 * É o isolamento multi-tenant na prática.
 */
public interface PatientRepository {
    Patient save(Patient patient);
    Optional<Patient> findById(Long id);
    Optional<Patient> findByCpf(String cpf);

    // ← clinicId em todos os métodos de busca
    List<Patient> findAllActiveByClinicId(Long clinicId);
    List<Patient> findByNameContainingAndClinicId(String name, Long clinicId);
    boolean existsByCpfAndClinicIdAndIdNot(String cpf, Long clinicId, Long excludeId);
    void deleteById(Long id);
}
