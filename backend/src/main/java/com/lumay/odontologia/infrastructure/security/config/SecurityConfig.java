package com.lumay.odontologia.infrastructure.security.config;

/*
 * ================================================================
 * AULA: SECURITY CONFIG — REGRAS DE ACESSO DO SISTEMA
 * ================================================================
 *
 * Este arquivo define:
 * 1. Quais endpoints são PÚBLICOS (sem login)
 * 2. Quais endpoints precisam de LOGIN
 * 3. Quais endpoints precisam de roles específicas (ADMIN, etc.)
 * 4. Configuração de CORS (quem pode chamar o backend)
 * 5. Configuração de CSRF (desabilitado pois usamos JWT, não cookies)
 * 6. Como a autenticação funciona (stateless = sem sessão)
 *
 * AULA: CORS (Cross-Origin Resource Sharing)
 * ===========================================
 * Por padrão, o navegador bloqueia requests de um domínio para outro.
 * Ex: frontend em localhost:3000 não pode chamar localhost:8080.
 * CORS é uma regra que permite isso de forma controlada.
 * Aqui liberamos apenas o localhost:3000 (nosso frontend).
 *
 * AULA: CSRF (Cross-Site Request Forgery)
 * ========================================
 * CSRF é um ataque onde um site malicioso faz o navegador do usuário
 * enviar requests para o seu backend sem que ele saiba.
 * Com JWT (token no header), esse ataque não funciona porque
 * o site malicioso não tem acesso ao token.
 * Por isso desabilitamos o CSRF — é seguro quando se usa JWT.
 *
 * AULA: Stateless (sem estado)
 * =============================
 * Sem sessão = o backend não "lembra" do usuário entre requests.
 * Cada request precisa trazer o token JWT.
 * Isso é escalável: você pode ter 100 servidores sem precisar
 * sincronizar sessão entre eles.
 * ================================================================
 */

import com.lumay.odontologia.infrastructure.security.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// @Configuration = arquivo de configuração do Spring
// @EnableWebSecurity = habilita o Spring Security
// @EnableMethodSecurity = habilita @PreAuthorize nos controllers
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /**
     * BCryptPasswordEncoder com força 12.
     *
     * AULA: O "12" é o "cost factor" (fator de custo).
     * Maior = mais seguro, mas mais lento para calcular.
     * 12 é o padrão recomendado (leva ~250ms por hash).
     * Isso é intencional: faz ataques de força bruta lentos!
     *
     * @Bean = Spring gerencia esta instância e injeta onde precisar
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    /**
     * Define as regras de segurança HTTP.
     *
     * AULA: As regras são avaliadas em ordem.
     * A primeira que bater vence.
     * Por isso endpoints específicos vêm antes dos genéricos.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // Desabilita CSRF (seguro com JWT)
                .csrf(AbstractHttpConfigurer::disable)

                // Configura CORS (quem pode chamar o backend)
                .cors(c -> c.configurationSource(corsSource()))

                // Sem sessão — cada request é independente
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Regras de autorização
                .authorizeHttpRequests(a -> a

                        // ── ENDPOINTS PÚBLICOS (sem login) ──────────────────────
                        // Login e cadastro de clínica são públicos
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/clinics/register").permitAll()

                        // Health check e documentação
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(
                                "/swagger-ui/**", "/swagger-ui.html",
                                "/api-docs/**", "/v3/api-docs/**"
                        ).permitAll()

                        // ── ENDPOINTS PROTEGIDOS POR ROLE ────────────────────────
                        // Listar todas as clínicas = só DEVELOPER
                        .requestMatchers(HttpMethod.GET, "/api/clinics").hasRole("DEVELOPER")

                        // Criar usuário = só ADMIN ou DEVELOPER
                        .requestMatchers("/api/auth/register").hasAnyRole("ADMIN", "DEVELOPER")

                        // Deletar qualquer coisa = só ADMIN ou DEVELOPER
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "DEVELOPER")

                        // ── TODOS OS OUTROS = PRECISA DE LOGIN ──────────────────
                        .anyRequest().authenticated()
                )

                // Adiciona nosso filtro JWT ANTES do filtro padrão de autenticação
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    /**
     * Configuração CORS — define quem pode chamar o backend.
     *
     * AULA: Em produção, substitua localhost:3000 pelo seu domínio real.
     * Ex: "https://app.suaclinica.com"
     */
    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // Origens permitidas (o frontend)
        cfg.setAllowedOrigins(List.of(
                "http://localhost:3000",   // Next.js em desenvolvimento
                "http://localhost:8080"    // chamadas diretas (Swagger, etc.)
        ));

        // Métodos HTTP permitidos
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers que o frontend pode enviar
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

        // Permite credenciais (cookies, Authorization header)
        cfg.setAllowCredentials(true);

        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);  // aplica para todas as rotas
        return src;
    }
}
