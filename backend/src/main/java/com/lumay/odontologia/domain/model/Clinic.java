package com.lumay.odontologia.domain.model;

/*
 * ================================================================
 * AULA DE JAVA — DOMAIN MODEL: O QUE É ISSO?
 * ================================================================
 *
 * Um "domain model" (modelo de domínio) é a classe Java que representa
 * um conceito do mundo real dentro do sistema.
 *
 * Aqui, Clinic representa UMA clínica odontológica.
 * Ela tem nome, email, plano contratado, etc.
 *
 * REGRAS IMPORTANTES desta arquitetura (Clean Architecture):
 * - Essa classe NÃO conhece o banco de dados
 * - Ela NÃO tem anotações do JPA (@Entity, @Table, etc.)
 * - Ela só tem lógica de negócio pura
 * - "Banco de dados? Não é problema meu." — essa classe.
 *
 * Por que isso é bom? Porque se você trocar de PostgreSQL para
 * MongoDB amanhã, essa classe não muda nada!
 * ================================================================
 */

import com.lumay.odontologia.domain.exception.BusinessException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/*
 * @Getter (Lombok): Gera automaticamente os métodos get para todos os campos.
 *   Ex: getId(), getName(), getEmail()...
 *   Sem Lombok, você escreveria isso à mão para cada campo. Lombok poupa tempo.
 *
 * @Builder (Lombok): Gera um padrão "Builder" para criar objetos.
 *   Em vez de: new Clinic(id, name, slug, email...)  (confuso, fácil errar a ordem)
 *   Você usa: Clinic.builder().name("X").slug("x").build()  (claro e legível)
 */
@Getter
@Builder
public class Clinic {

    /*
     * "final" = não pode ser alterado depois de criado.
     * O id nunca muda. O nome pode mudar (update), o id não.
     */
    private final Long id;
    private String name;
    private String slug;      // ex: "clinica-sorriso-sp" — usado em URLs
    private String email;
    private String phone;
    private String address;
    private ClinicPlan plan;  // qual plano a clínica contratou
    private boolean active;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /*
     * AULA: enum é uma lista fechada de opções.
     * Uma clínica só pode ter um desses três planos. Não pode ser "MEGA" ou "SUPER".
     * Isso evita erros de digitação e deixa o código mais seguro.
     */
    public enum ClinicPlan {
        BASIC,      // funcionalidades básicas
        PRO,        // funcionalidades intermediárias
        ENTERPRISE  // tudo liberado, suporte prioritário
    }

    /*
     * ================================================================
     * MÉTODO ESTÁTICO DE FÁBRICA (Factory Method)
     * ================================================================
     *
     * AULA: Por que "static"? Porque você chama sem precisar de um objeto pronto.
     *   Clinic.create(...)  ← não precisa de uma Clinic existente para chamar isso
     *
     * Por que não usar o construtor diretamente?
     * Porque aqui podemos:
     *   1. Validar os dados ANTES de criar o objeto
     *   2. Definir valores padrão (active=true, createdAt=agora)
     *   3. O nome "create" deixa a intenção clara
     *
     * Se os dados forem inválidos, lança BusinessException e PARA.
     * O objeto nunca é criado em estado inválido. Isso é segurança!
     * ================================================================
     */
    public static Clinic create(String name, String slug, String email, String phone) {

        // Validações — se qualquer uma falhar, nada é criado
        if (name == null || name.isBlank()) {
            throw new BusinessException("O nome da clínica é obrigatório.");
        }
        if (slug == null || slug.isBlank()) {
            throw new BusinessException("O slug da clínica é obrigatório.");
        }
        // Slug deve ter apenas letras, números e hífens (para ser uma URL válida)
        if (!slug.matches("^[a-z0-9-]{3,100}$")) {
            throw new BusinessException("Slug inválido. Use apenas letras minúsculas, números e hífens (ex: minha-clinica).");
        }

        // .builder() começa a construção, cada .campo() define um valor, .build() finaliza
        return Clinic.builder()
                .name(name.trim())
                .slug(slug.toLowerCase().trim())
                .email(email)
                .phone(phone)
                .plan(ClinicPlan.BASIC)  // toda clínica começa no plano básico
                .active(true)            // já começa ativa
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /*
     * AULA: Método de instância (não-static) — só funciona em um objeto existente.
     * Você faz: minhaClinica.updateInfo("Novo Nome", ...)
     *
     * "this" se refere ao objeto atual. this.name = o campo name DESTE objeto.
     */
    public void updateInfo(String name, String email, String phone, String address) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("O nome é obrigatório.");
        }
        this.name    = name.trim();
        this.email   = email;
        this.phone   = phone;
        this.address = address;
        this.updatedAt = LocalDateTime.now();
    }

    /** Desativa a clínica (todos os usuários dela ficam sem acesso). */
    public void deactivate() {
        if (!this.active) {
            throw new BusinessException("Clínica já está desativada.");
        }
        this.active    = false;
        this.updatedAt = LocalDateTime.now();
    }

    /** Muda o plano da clínica. */
    public void changePlan(ClinicPlan newPlan) {
        if (newPlan == null) {
            throw new BusinessException("Plano não pode ser nulo.");
        }
        this.plan      = newPlan;
        this.updatedAt = LocalDateTime.now();
    }
}
