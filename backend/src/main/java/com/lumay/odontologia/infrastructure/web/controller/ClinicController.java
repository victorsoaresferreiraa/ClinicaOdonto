package com.lumay.odontologia.infrastructure.web.controller;

/*
 * ================================================================
 * AULA: CONTROLLER — A PORTA DE ENTRADA DO BACKEND
 * ================================================================
 *
 * O Controller é o primeiro ponto de contato do backend com o mundo.
 * Ele:
 *   1. Recebe requests HTTP do frontend
 *   2. Extrai os dados (body, path variables, query params)
 *   3. Chama o UseCase com esses dados
 *   4. Devolve a resposta HTTP
 *
 * O Controller NÃO tem lógica de negócio.
 * Ele delega tudo para o UseCase.
 * Pense nele como um "garçom": recebe o pedido e leva para a cozinha.
 *
 * ANOTAÇÕES IMPORTANTES:
 *   @RestController    = "Esta classe responde requests HTTP em formato JSON"
 *   @RequestMapping    = prefixo de todas as rotas desta classe
 *   @GetMapping        = responde GET  (buscar dados)
 *   @PostMapping       = responde POST (criar dados)
 *   @PutMapping        = responde PUT  (atualizar dados completos)
 *   @PatchMapping      = responde PATCH (atualizar dados parciais)
 *   @DeleteMapping     = responde DELETE (remover dados)
 *
 *   @PathVariable      = pega o {id} da URL  ex: /api/clinics/5
 *   @RequestBody       = pega o corpo JSON    ex: {"name": "Clínica X"}
 *   @Valid             = executa as validações do DTO (@NotBlank, etc.)
 *
 *   ResponseEntity<T>  = resposta HTTP com código de status + corpo
 *     .ok(body)        = 200 OK
 *     .status(201).body(x) = 201 Created
 *     .noContent()     = 204 No Content
 * ================================================================
 */

import com.lumay.odontologia.application.dto.ClinicDTO;
import com.lumay.odontologia.application.usecase.ClinicUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clinics")
@RequiredArgsConstructor
@Tag(name = "Clínicas", description = "Gestão de clínicas (multi-tenant)")
public class ClinicController {

    private final ClinicUseCase useCase;

    /*
     * ── ENDPOINT PÚBLICO ────────────────────────────────────────────
     *
     * POST /api/clinics/register
     * Qualquer pessoa pode chamar. Não precisa de token.
     * Cria a clínica + admin e retorna token JWT para login imediato.
     *
     * AULA: @Operation é uma anotação do Swagger.
     * Ela descreve o endpoint na documentação da API.
     * Acesse: http://localhost:8080/swagger-ui.html
     */
    @PostMapping("/register")
    @Operation(summary = "Auto-cadastro: criar nova clínica + conta admin")
    public ResponseEntity<ClinicDTO.RegisterResponse> register(
            @Valid @RequestBody ClinicDTO.RegisterRequest req
    ) {
        ClinicDTO.RegisterResponse response = useCase.register(req);
        // 201 Created = recurso criado com sucesso
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /*
     * ── ENDPOINTS PROTEGIDOS ────────────────────────────────────────
     * Os endpoints abaixo precisam de token JWT no header:
     *   Authorization: Bearer {token}
     *
     * @SecurityRequirement(name = "bearerAuth") documenta isso no Swagger.
     */

    /**
     * GET /api/clinics — lista todas as clínicas (só DEVELOPER).
     * O SecurityConfig.java já garante que só DEVELOPER chega aqui.
     */
    @GetMapping
    @Operation(summary = "Listar todas as clínicas [DEVELOPER only]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<ClinicDTO.Response>> findAll() {
        return ResponseEntity.ok(useCase.findAll());
    }

    /**
     * GET /api/clinics/{id} — busca uma clínica por ID.
     * DEVELOPER vê qualquer clínica; ADMIN só vê a sua.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Buscar clínica por ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ClinicDTO.Response> findById(@PathVariable Long id) {
        return ResponseEntity.ok(useCase.findById(id));
    }

    /**
     * PUT /api/clinics/{id} — atualiza dados da clínica.
     * Só ADMIN da clínica ou DEVELOPER pode fazer isso.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar dados da clínica [ADMIN ou DEVELOPER]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ClinicDTO.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody ClinicDTO.UpdateRequest req
    ) {
        return ResponseEntity.ok(useCase.update(id, req));
    }
}
