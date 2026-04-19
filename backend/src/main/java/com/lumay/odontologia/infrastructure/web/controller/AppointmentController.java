package com.lumay.odontologia.infrastructure.web.controller;
import com.lumay.odontologia.application.dto.AppointmentDTO;
import com.lumay.odontologia.application.usecase.AppointmentUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController @RequestMapping("/api/appointments") @RequiredArgsConstructor
@Tag(name="Agendamentos") @SecurityRequirement(name="bearerAuth")
public class AppointmentController {
    private final AppointmentUseCase useCase;

    @PostMapping @Operation(summary="Criar agendamento")
    public ResponseEntity<AppointmentDTO.Response> create(@Valid @RequestBody AppointmentDTO.CreateRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(req)); }

    @GetMapping("/{id}") @Operation(summary="Buscar por ID")
    public ResponseEntity<AppointmentDTO.Response> findById(@PathVariable Long id) { return ResponseEntity.ok(useCase.findById(id)); }

    @GetMapping("/patient/{id}") @Operation(summary="Listar por paciente")
    public ResponseEntity<List<AppointmentDTO.Response>> findByPatient(@PathVariable Long id) { return ResponseEntity.ok(useCase.findByPatient(id)); }

    @GetMapping("/range") @Operation(summary="Listar por período")
    public ResponseEntity<List<AppointmentDTO.Response>> findByRange(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(useCase.findByRange(start, end));
    }

    @PatchMapping("/{id}/confirm")  public ResponseEntity<AppointmentDTO.Response> confirm(@PathVariable Long id)  { return ResponseEntity.ok(useCase.confirm(id)); }
    @PatchMapping("/{id}/cancel")   public ResponseEntity<AppointmentDTO.Response> cancel(@PathVariable Long id)   { return ResponseEntity.ok(useCase.cancel(id)); }
    @PatchMapping("/{id}/complete") public ResponseEntity<AppointmentDTO.Response> complete(@PathVariable Long id) { return ResponseEntity.ok(useCase.complete(id)); }
}
