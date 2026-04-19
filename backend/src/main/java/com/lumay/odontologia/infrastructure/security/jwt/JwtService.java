package com.lumay.odontologia.infrastructure.security.jwt;

/*
 * ================================================================
 * AULA: JWT — JSON WEB TOKEN
 * ================================================================
 *
 * JWT é um token de autenticação que funciona como um crachá digital.
 *
 * ESTRUTURA DO JWT (3 partes separadas por ponto):
 *   header.payload.signature
 *   xxxxxxx.yyyyyyy.zzzzzzz
 *
 * 1. HEADER: tipo do token e algoritmo de assinatura
 *    {"alg": "HS256", "typ": "JWT"}
 *
 * 2. PAYLOAD: os dados (claims) — quem é o usuário, qual role, etc.
 *    {"sub": "email@clinica.com", "role": "ADMIN", "clinicId": 1, "exp": 1234567890}
 *
 * 3. SIGNATURE: assinatura digital que prova que o token é autêntico
 *    HMAC-SHA256(base64(header) + "." + base64(payload), SECRET_KEY)
 *
 * O JWT é PUBLIC: qualquer um pode decodificar o payload!
 * A SEGURANÇA está na assinatura: só quem tem o SECRET_KEY pode gerar
 * um token válido. Por isso o SECRET_KEY deve ser secreto!
 *
 * O que mudou nessa versão:
 *   - generateToken() agora recebe clinicId e inclui no payload
 *   - extractClinicId() extrai o clinicId do token
 * ================================================================
 */

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    /*
     * @Value lê a configuração do application.yml
     * Se JWT_SECRET não está definido como variável de ambiente,
     * usa o valor padrão após os dois-pontos.
     *
     * AULA: ${jwt.secret} = leia "jwt.secret" do application.yml
     */
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;  // padrão: 86400000ms = 24 horas

    /**
     * Gera um token JWT com os dados do usuário.
     *
     * AULA: Claims = dados dentro do token.
     * O token carrega: email (subject), role, clinicId.
     * Depois de logado, não precisa ir ao banco para saber quem é o usuário.
     * O token tem tudo!
     *
     * @param email    email do usuário (será o "subject" do token)
     * @param role     ADMIN, DENTIST, etc.
     * @param clinicId ID da clínica (null para DEVELOPER)
     */
    public String generateToken(String email, String role, Long clinicId) {

        // Claims são os dados extras que colocamos no token
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

        // Só adiciona clinicId se existir (DEVELOPER não tem)
        if (clinicId != null) {
            claims.put("clinicId", clinicId);
        }

        // Constrói o token JWT usando o padrão builder
        return Jwts.builder()
                .claims(claims)                                      // dados extras
                .subject(email)                                      // quem é o usuário
                .issuedAt(new Date())                                // quando foi gerado
                .expiration(new Date(System.currentTimeMillis() + expirationMs)) // quando expira
                .signWith(key())                                     // assina com a chave secreta
                .compact();                                          // gera a string final
    }

    /** Extrai o email (subject) do token. */
    public String extractEmail(String token) {
        return claim(token, Claims::getSubject);
    }

    /** Extrai a role do token. */
    public String extractRole(String token) {
        return claim(token, c -> c.get("role", String.class));
    }

    /** Extrai o clinicId do token (pode ser null para DEVELOPER). */
    public Long extractClinicId(String token) {
        return claim(token, c -> {
            Object val = c.get("clinicId");
            if (val == null) return null;
            // O JWT guarda números como Integer, mas precisamos de Long
            return ((Number) val).longValue();
        });
    }

    /**
     * Verifica se o token é válido.
     * Token válido = email bate E não expirou.
     *
     * AULA: Toda request que chega ao backend (exceto /api/auth/**)
     * passa pelo JwtAuthFilter que chama este método.
     */
    public boolean isValid(String token, String email) {
        try {
            return extractEmail(token).equals(email) && !isExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            // JwtException = token malformado, assinatura inválida, etc.
            log.warn("JWT inválido: {}", e.getMessage());
            return false;
        }
    }

    // ─── Métodos privados (só uso interno) ───────────────────────

    /** Verifica se o token expirou. */
    private boolean isExpired(String token) {
        return claim(token, Claims::getExpiration).before(new Date());
    }

    /**
     * Extrai qualquer claim do token usando uma função.
     *
     * AULA: Function<Claims, T> é uma função que recebe Claims e retorna T.
     * É um padrão funcional: você passa "o que fazer com os claims".
     *
     * Ex: claim(token, Claims::getSubject)
     *   → chama getSubject() nos claims → retorna o email
     */
    private <T> T claim(String token, Function<Claims, T> fn) {
        Claims claims = Jwts.parser()
                .verifyWith(key())  // verifica a assinatura com a chave secreta
                .build()
                .parseSignedClaims(token)
                .getPayload();      // pega o payload (os dados)
        return fn.apply(claims);
    }

    /**
     * Converte o secret (base64) em uma chave criptográfica.
     *
     * AULA: A chave é derivada do JWT_SECRET configurado.
     * Todos os tokens são assinados com ela.
     * Se você mudar o secret, TODOS os tokens antigos ficam inválidos!
     */
    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }
}
