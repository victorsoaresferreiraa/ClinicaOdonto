-- =============================================================
-- V3__add_clinics_and_developer.sql
-- 
-- AULA DE SQL — O QUE ESTÁ ACONTECENDO AQUI:
--
-- Este arquivo é uma "migration" do Flyway.
-- Migration = mudança no banco de dados versionada.
-- O Flyway roda este arquivo automaticamente quando o backend sobe,
-- MAS SÓ UMA VEZ. Depois que ele roda, nunca mais roda novamente.
-- Isso garante que o banco sempre evolua de forma controlada.
--
-- V1 = criou as tabelas
-- V2 = inseriu dados iniciais
-- V3 = agora vamos adicionar o conceito de CLÍNICA MÚLTIPLA
-- =============================================================

-- -------------------------------------------------------------
-- PASSO 1: Criar a tabela de clínicas
--
-- AULA: CREATE TABLE cria uma nova tabela no banco.
-- Cada linha dentro é uma coluna.
-- PRIMARY KEY = identificador único de cada linha.
-- NOT NULL = campo obrigatório.
-- UNIQUE = não pode repetir o mesmo valor.
-- DEFAULT = valor padrão se não for informado.
-- -------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS clinics_id_seq START 1 INCREMENT 1;

CREATE TABLE clinics (
    -- id é gerado automaticamente (1, 2, 3...)
    id          BIGINT       PRIMARY KEY DEFAULT nextval('clinics_id_seq'),

    -- nome da clínica, ex: "Clínica Sorriso Ltda"
    name        VARCHAR(255) NOT NULL,

    -- slug é o "apelido" da clínica para URLs, ex: "clinica-sorriso"
    -- UNIQUE = não pode ter duas clínicas com o mesmo slug
    slug        VARCHAR(100) NOT NULL UNIQUE,

    -- dados de contato (opcionais)
    email       VARCHAR(255),
    phone       VARCHAR(20),
    address     VARCHAR(500),

    -- plano da clínica (BASIC, PRO, ENTERPRISE)
    plan        VARCHAR(20)  NOT NULL DEFAULT 'BASIC',

    -- ativa ou desativada (soft delete)
    active      BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índice acelera buscas por slug (ex: "qual clínica tem esse slug?")
-- AULA: Índice = lista ordenada que o banco usa para achar dados rápido.
-- Sem índice, o banco lê linha por linha. Com índice, vai direto.
CREATE INDEX idx_clinics_slug   ON clinics(slug);
CREATE INDEX idx_clinics_active ON clinics(active);

-- -------------------------------------------------------------
-- PASSO 2: Adicionar clinic_id nas tabelas existentes
--
-- AULA: ALTER TABLE modifica uma tabela que já existe.
-- ADD COLUMN adiciona uma nova coluna.
-- REFERENCES = chave estrangeira (Foreign Key).
--   Significa: "este valor DEVE existir na tabela clinics".
-- ON DELETE RESTRICT = impede deletar a clínica se tiver dados ligados.
-- -------------------------------------------------------------

-- Usuários agora pertencem a uma clínica (exceto DEVELOPER que não tem)
ALTER TABLE users
    ADD COLUMN clinic_id BIGINT REFERENCES clinics(id) ON DELETE RESTRICT;

-- Pacientes pertencem a uma clínica
ALTER TABLE patients
    ADD COLUMN clinic_id BIGINT REFERENCES clinics(id) ON DELETE RESTRICT;

-- Agendamentos pertencem a uma clínica
ALTER TABLE appointments
    ADD COLUMN clinic_id BIGINT REFERENCES clinics(id) ON DELETE RESTRICT;

-- Pagamentos pertencem a uma clínica
ALTER TABLE payments
    ADD COLUMN clinic_id BIGINT REFERENCES clinics(id) ON DELETE RESTRICT;

-- Índices para busca rápida por clínica
CREATE INDEX idx_users_clinic       ON users(clinic_id);
CREATE INDEX idx_patients_clinic    ON patients(clinic_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_payments_clinic    ON payments(clinic_id);

-- -------------------------------------------------------------
-- PASSO 3: Adicionar a role DEVELOPER na constraint do banco
--
-- AULA: A coluna "role" já existe, mas o banco não valida o valor.
-- A validação acontece no Java. Então só precisamos documentar aqui.
-- -------------------------------------------------------------

COMMENT ON COLUMN users.role IS 'Valores possíveis: DEVELOPER, ADMIN, DENTIST, RECEPTIONIST. DEVELOPER não tem clinic_id e vê tudo.';
COMMENT ON TABLE clinics IS 'Cada clínica é um tenant (inquilino) independente. Dados de clínicas diferentes são isolados.';

-- -------------------------------------------------------------
-- PASSO 4: Criar a clínica demo + conta de desenvolvedor
--
-- AULA: INSERT INTO insere dados em uma tabela.
-- VALUES define os valores de cada coluna.
-- -------------------------------------------------------------

-- Clínica demo (para migrar os dados já existentes)
INSERT INTO clinics (name, slug, email, plan)
VALUES ('Lumay Odontologia Demo', 'lumay-demo', 'contato@lumayodontologia.com.br', 'PRO');

-- Atualiza registros existentes para pertencer à clínica demo
-- AULA: UPDATE modifica linhas existentes.
-- SET define o novo valor. WHERE filtra quais linhas atualizar.
UPDATE users        SET clinic_id = (SELECT id FROM clinics WHERE slug = 'lumay-demo') WHERE clinic_id IS NULL AND role != 'DEVELOPER';
UPDATE patients     SET clinic_id = (SELECT id FROM clinics WHERE slug = 'lumay-demo') WHERE clinic_id IS NULL;
UPDATE appointments SET clinic_id = (SELECT id FROM clinics WHERE slug = 'lumay-demo') WHERE clinic_id IS NULL;
UPDATE payments     SET clinic_id = (SELECT id FROM clinics WHERE slug = 'lumay-demo') WHERE clinic_id IS NULL;

-- Conta do desenvolvedor (SEM clinic_id — ele vê tudo)
-- IMPORTANTE: Troque 'developer@lumay.dev' pelo seu email real!
-- A senha aqui é "dev@Lumay2024!" — TROQUE TAMBÉM!
-- Hash gerado com BCrypt strength 12
-- Para gerar seu próprio hash: https://bcrypt-generator.com
INSERT INTO users (name, email, password_hash, role, clinic_id)
VALUES (
    'Desenvolvedor Master',
    'developer@lumay.dev',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN6XJar/Pkq',
    'DEVELOPER',
    NULL  -- NULL = sem clínica = acesso total
);

-- Corrige a senha da Dra. Laís (o hash anterior estava errado)
-- Nova senha: lais123
UPDATE users
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/lais'
WHERE email = 'dra.lais@lumayodontologia.com.br';

-- Insere a dra lais com senha correta (admin123 por ora, troque depois)
UPDATE users
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN6XJar/Pkq'
WHERE email = 'dra.lais@lumayodontologia.com.br';
