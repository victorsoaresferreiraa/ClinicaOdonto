package com.lumay.odontologia.infrastructure.web.controller;
import com.lumay.odontologia.application.dto.PatientDTO;
import com.lumay.odontologia.application.usecase.PatientUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/patients") @RequiredArgsConstructor
@Tag(name="Pacientes") @SecurityRequirement(name="bearerAuth")
public class PatientController {
    private final PatientUseCase useCase;

    @PostMapping   @Operation(summary="Criar paciente")
    public ResponseEntity<PatientDTO.Response> create(@Valid @RequestBody PatientDTO.CreateRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(req)); }

    @GetMapping    @Operation(summary="Listar ativos")
    public ResponseEntity<List<PatientDTO.Response>> findAll() { return ResponseEntity.ok(useCase.findAllActive()); }

    @GetMapping("/{id}") @Operation(summary="Buscar por ID")
    public ResponseEntity<PatientDTO.Response> findById(@PathVariable Long id) { return ResponseEntity.ok(useCase.findById(id)); }

    @GetMapping("/search") @Operation(summary="Buscar por nome")
    public ResponseEntity<List<PatientDTO.Response>> search(@RequestParam String name) { return ResponseEntity.ok(useCase.findByName(name)); }

    @PutMapping("/{id}") @Operation(summary="Atualizar")
    public ResponseEntity<PatientDTO.Response> update(@PathVariable Long id, @Valid @RequestBody PatientDTO.UpdateRequest req) { return ResponseEntity.ok(useCase.update(id, req)); }

    @DeleteMapping("/{id}") @Operation(summary="Desativar (soft delete)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) { useCase.deactivate(id); return ResponseEntity.noContent().build(); }
}
