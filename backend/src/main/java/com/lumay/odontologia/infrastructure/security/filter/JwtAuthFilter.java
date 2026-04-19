package com.lumay.odontologia.infrastructure.security.filter;

/*
 * ================================================================
 * AULA: FILTER (FILTRO) — O PORTEIRO DO SISTEMA
 * ================================================================
 *
 * Imagine uma portaria em um prédio corporativo.
 * Toda pessoa que entra PRECISA mostrar o crachá.
 * O porteiro verifica o crachá antes de deixar entrar.
 *
 * O JwtAuthFilter é esse porteiro!
 *
 * FLUXO DE CADA REQUEST:
 *   1. Request chega (ex: GET /api/patients)
 *   2. JwtAuthFilter intercepta ANTES do controller
 *   3. Lê o header "Authorization: Bearer abc123..."
 *   4. Extrai o token e valida
 *   5. Se válido: coloca o usuário no SecurityContext (autenticado)
 *   6. Se inválido: continua sem autenticação (controller vai negar depois)
 *   7. Passa o request para o próximo filtro/controller
 *
 * AULA: OncePerRequestFilter
 * Garante que este filtro roda EXATAMENTE UMA VEZ por request.
 * Sem isso, poderia rodar múltiplas vezes em alguns cenários.
 *
 * AULA: SecurityContextHolder
 * É o "caderninho" do Spring Security para o request atual.
 * Guarda quem está autenticado. Dura só durante o request.
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.security.jwt.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    /**
     * Este método roda para CADA request que chega ao sistema.
     *
     * @param req   o request HTTP (contém headers, body, etc.)
     * @param res   o response HTTP (o que será enviado de volta)
     * @param chain a cadeia de filtros (o próximo passo)
     *
     * AULA: @NonNull é uma anotação de documentação que diz
     * "este parâmetro nunca será null". Evita confusão.
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest req,
            @NonNull HttpServletResponse res,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        // Passo 1: lê o header Authorization
        // Formato esperado: "Bearer eyJhbGciOiJIUzI1NiJ9..."
        String header = req.getHeader("Authorization");

        // Se não tem o header ou não começa com "Bearer ", deixa passar sem autenticar
        // O Spring Security vai bloquear depois se a rota precisar de auth
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);  // passa para o próximo filtro
            return;
        }

        // Passo 2: extrai o token (remove o "Bearer " do início)
        // "Bearer " tem 7 caracteres, então pegamos do índice 7 em diante
        String token = header.substring(7);

        try {
            // Passo 3: extrai os dados do token
            String email    = jwtService.extractEmail(token);
            String role     = jwtService.extractRole(token);
            Long   clinicId = jwtService.extractClinicId(token);

            // Só autentica se:
            // - email foi extraído com sucesso
            // - ainda não há autenticação no contexto (evita reprocessar)
            // - o token é válido (não expirado e assinatura correta)
            if (email != null
                    && SecurityContextHolder.getContext().getAuthentication() == null
                    && jwtService.isValid(token, email)) {

                // Passo 4: cria o objeto de autenticação do Spring Security
                // SimpleGrantedAuthority("ROLE_ADMIN") = autoridade de ADMIN
                // O Spring Security usa "ROLE_" como prefixo para roles
                var auth = new UsernamePasswordAuthenticationToken(
                        email,                                        // principal (quem é)
                        null,                                         // credenciais (null pois já validamos)
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)) // permissões
                );

                // Adiciona detalhes do request (IP, etc.) — útil para auditoria
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));

                // Passo 5: registra a autenticação no contexto do request
                SecurityContextHolder.getContext().setAuthentication(auth);

                // Opcional: adiciona clinicId como atributo do request
                // Para que outros filtros e controllers possam acessar facilmente
                if (clinicId != null) {
                    req.setAttribute("clinicId", clinicId);
                }

                log.debug("Usuário autenticado via JWT: {} (role: {}, clinic: {})",
                        email, role, clinicId);
            }

        } catch (Exception e) {
            // Token malformado, expirado, etc.
            // Não lança exceção aqui — apenas loga e deixa o request prosseguir sem auth
            // O Spring Security bloqueará se a rota precisar de auth
            log.warn("Falha ao processar JWT: {}", e.getMessage());
        }

        // Passo 6: passa para o próximo filtro na cadeia
        chain.doFilter(req, res);
    }
}
