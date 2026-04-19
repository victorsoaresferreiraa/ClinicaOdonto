package com.lumay.odontologia.infrastructure.web.controller;

/*
 * ================================================================
 * AULA: AUTH CONTROLLER — ENDPOINTS DE AUTENTICAÇÃO
 * ================================================================
 *
 * Este controller tem 2 endpoints:
 *
 * 1. POST /api/auth/login   → público, qualquer um acessa
 * 2. POST /api/auth/register → protegido, só ADMIN ou DEVELOPER
 *
 * AULA: Por que o login não precisa de token?
 * Porque é justamente aí que o token é GERADO.
 * Você precisa do token para fazer login? Não! O login gera o token.
 *
 * O SecurityConfig.java libera /api/auth/login para todos.
 * ================================================================
 */

import com.lumay.odontologia.application.dto.AuthDTO;
import com.lumay.odontologia.application.usecase.AuthUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login e cadastro de usuários")
public class AuthController {

    private final AuthUseCase useCase;

    /**
     * POST /api/auth/login
     *
     * AULA: Teste no terminal com curl:
     *   curl -X POST http://localhost:8080/api/auth/login \
     *        -H "Content-Type: application/json" \
     *        -d '{"email":"admin@lumayodontologia.com.br","password":"admin123"}'
     *
     * Ou use o Swagger em http://localhost:8080/swagger-ui.html
     */
    @PostMapping("/login")
    @Operation(summary = "Fazer login — retorna token JWT")
    public ResponseEntity<AuthDTO.LoginResponse> login(
            @Valid @RequestBody AuthDTO.LoginRequest req
    ) {
        return ResponseEntity.ok(useCase.login(req));
    }

    /**
     * POST /api/auth/register
     * Cria um novo usuário dentro da clínica do admin logado.
     *
     * AULA: 204 No Content = sucesso, mas sem corpo na resposta.
     * Faz sentido aqui porque não precisamos devolver o usuário criado.
     */
    @PostMapping("/register")
    @Operation(summary = "Criar usuário na clínica [ADMIN ou DEVELOPER]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> register(
            @Valid @RequestBody AuthDTO.RegisterRequest req
    ) {
        useCase.register(req);
        return ResponseEntity.noContent().build();
    }
}
