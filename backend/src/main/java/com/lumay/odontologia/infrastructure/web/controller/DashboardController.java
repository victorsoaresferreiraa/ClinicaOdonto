package com.lumay.odontologia.infrastructure.web.controller;
import com.lumay.odontologia.application.dto.DashboardDTO;
import com.lumay.odontologia.application.usecase.DashboardUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
@Tag(name="Dashboard") @SecurityRequirement(name="bearerAuth")
public class DashboardController {
    private final DashboardUseCase useCase;

    @GetMapping @Operation(summary="Dados da tela inicial")
    public ResponseEntity<DashboardDTO.Response> getDashboard() { return ResponseEntity.ok(useCase.getDashboard()); }
}
