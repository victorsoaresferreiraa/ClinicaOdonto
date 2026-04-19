package com.lumay.odontologia.infrastructure.web.controller;
import com.lumay.odontologia.application.dto.PaymentDTO;
import com.lumay.odontologia.application.usecase.PaymentUseCase;
import com.lumay.odontologia.domain.model.Payment.PaymentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/payments") @RequiredArgsConstructor
@Tag(name="Financeiro") @SecurityRequirement(name="bearerAuth")
public class PaymentController {
    private final PaymentUseCase useCase;

    @PostMapping @Operation(summary="Criar cobrança")
    public ResponseEntity<PaymentDTO.Response> create(@Valid @RequestBody PaymentDTO.CreateRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(req)); }

    @GetMapping("/{id}") public ResponseEntity<PaymentDTO.Response> findById(@PathVariable Long id) { return ResponseEntity.ok(useCase.findById(id)); }

    @GetMapping("/patient/{id}") public ResponseEntity<List<PaymentDTO.Response>> findByPatient(@PathVariable Long id) { return ResponseEntity.ok(useCase.findByPatient(id)); }

    @GetMapping("/status/{status}") public ResponseEntity<List<PaymentDTO.Response>> findByStatus(@PathVariable PaymentStatus status) { return ResponseEntity.ok(useCase.findByStatus(status)); }

    @PatchMapping("/{id}/pay") public ResponseEntity<PaymentDTO.Response> markAsPaid(@PathVariable Long id, @RequestBody(required=false) PaymentDTO.MarkAsPaidRequest req) { return ResponseEntity.ok(useCase.markAsPaid(id, req)); }

    @PatchMapping("/{id}/cancel") public ResponseEntity<PaymentDTO.Response> cancel(@PathVariable Long id) { return ResponseEntity.ok(useCase.cancel(id)); }
}
