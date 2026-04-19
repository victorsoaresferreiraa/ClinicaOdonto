# 🦷 Lumay Odontologia — Sistema Multi-Clínica

> Documentação completa para programadores juniores.
> Aqui você aprende Java, Spring Boot, Next.js e banco de dados com exemplos reais.

---

## 🗺️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│  NAVEGADOR (localhost:3000)                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Next.js + React (TypeScript)          │   │
│  │  /login    /register    /dashboard    /patients  │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (localhost:8080)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Spring Boot (Java 21)                   │   │
│  │                                                 │   │
│  │  Controller → UseCase → Repository → Adapter    │   │
│  │        ↓           ↓          ↓         ↓       │   │
│  │   Recebe req  Lógica  Contrato   JPA + SQL      │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │ JDBC
                      ▼
┌─────────────────────────────────────────────────────────┐
│  BANCO DE DADOS (localhost:5432)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL                                     │   │
│  │  clinics | users | patients | appointments |    │   │
│  │  payments                                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Como rodar (do zero)

```bash
# 1. Entre na pasta do projeto
cd lumay-v2

# 2. Instale as dependências do frontend (só na primeira vez)
cd frontend && npm install && cd ..

# 3. Suba tudo com Docker
docker compose up -d --build

# 4. Aguarde ~2 minutos. Verifique se está rodando:
docker compose ps

# 5. Acesse:
#   Sistema:       http://localhost:3000
#   API/Swagger:   http://localhost:8080/swagger-ui.html
#   Banco (admin): http://localhost:5050
```

### Credenciais padrão

| O quê | Email | Senha |
|-------|-------|-------|
| Sistema (Admin) | admin@lumayodontologia.com.br | admin123 |
| **Desenvolvedor** (você) | developer@lumay.dev | admin123 |
| PgAdmin (banco visual) | admin@lumayodontologia.com.br | admin123 |

> ⚠️ Troque a senha do desenvolvedor! Veja como na seção abaixo.

---

## 🔑 Como criar sua conta de Desenvolvedor

Após subir o sistema, acesse o PgAdmin em http://localhost:5050 e execute:

```sql
-- Troque o email e gere um hash em: https://bcrypt-generator.com (strength 12)
UPDATE users
SET email = 'SEU@EMAIL.COM',
    password_hash = '$2a$12$SEU_HASH_AQUI'
WHERE role = 'DEVELOPER';
```

Ou via Swagger:
1. Acesse http://localhost:8080/swagger-ui.html
2. Faça login com o admin
3. Use `POST /api/auth/login` e copie o token
4. Autorize no Swagger (botão "Authorize")
5. Chame `PUT /api/clinics/{id}` para atualizar dados

---

## 🏥 Como cadastrar uma nova clínica

Qualquer pessoa pode cadastrar sua clínica em:

```
http://localhost:3000/register
```

Ou via API:

```bash
curl -X POST http://localhost:8080/api/clinics/register \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Clínica Sorriso",
    "clinicSlug": "clinica-sorriso",
    "clinicEmail": "contato@sorriso.com",
    "adminName": "Dr. João",
    "adminEmail": "joao@sorriso.com",
    "adminPassword": "minhasenha123"
  }'
```

A resposta inclui um `token` JWT — o admin já está logado!

---

## 📁 Estrutura de arquivos

```
lumay-v2/
├── docker-compose.yml          ← sobe tudo com 1 comando
│
├── frontend/src/
│   ├── app/
│   │   ├── login/page.tsx      ← tela de login
│   │   ├── register/page.tsx   ← ← NOVO: cadastro de clínica
│   │   ├── dashboard/page.tsx  ← painel principal
│   │   ├── patients/           ← gestão de pacientes
│   │   ├── appointments/       ← agendamentos
│   │   └── payments/           ← financeiro
│   └── lib/api.ts              ← todas as chamadas HTTP
│
└── backend/src/main/java/.../
    ├── domain/
    │   ├── model/              ← Clinic, User, Patient, Appointment, Payment
    │   ├── repository/         ← contratos de banco (interfaces)
    │   └── exception/          ← exceções de negócio
    ├── application/
    │   ├── dto/                ← formatos de dados (request/response)
    │   └── usecase/            ← ← TODA a lógica de negócio está aqui
    └── infrastructure/
        ├── security/
        │   ├── config/         ← SecurityConfig: regras de acesso
        │   ├── filter/         ← JwtAuthFilter: porteiro do sistema
        │   ├── jwt/            ← JwtService: cria/valida tokens
        │   └── context/        ← ← NOVO: CurrentUserService
        ├── persistence/
        │   ├── entity/         ← tabelas do banco em Java
        │   ├── repository/     ← JPA repositories (Spring Data)
        │   └── adapter/        ← ponte domínio ↔ banco
        └── web/controller/     ← endpoints HTTP
```

---

## 🔐 Sistema de Roles (Permissões)

| Role | Quem é | O que pode |
|------|--------|-----------|
| `DEVELOPER` | Você, o dono do sistema | Tudo + vê todas as clínicas |
| `ADMIN` | Administrador de UMA clínica | Tudo dentro da clínica dele |
| `DENTIST` | Dentista de UMA clínica | Criar/ver/editar (não deletar) |
| `RECEPTIONIST` | Recepcionista de UMA clínica | Criar/ver/editar (não deletar) |

### Isolamento de dados (Multi-Tenant)

Cada clínica é um **tenant** (inquilino) independente.
Dados de clínicas diferentes NUNCA se misturam.

```
Clínica A → vê só pacientes, consultas e pagamentos da Clínica A
Clínica B → vê só pacientes, consultas e pagamentos da Clínica B
DEVELOPER → vê TUDO (todas as clínicas)
```

Como funciona:
1. O JWT carrega o `clinicId` do usuário
2. `CurrentUserService` extrai o `clinicId` em qualquer UseCase
3. Todas as queries filtram por `clinicId`

---

## 🎓 O que aprender neste projeto

### Java & Spring Boot
- **Clean Architecture**: domínio → application → infrastructure
- **JWT Authentication**: tokens seguros sem sessão
- **Spring Security**: regras de acesso declarativas
- **Spring Data JPA**: queries sem escrever SQL na maioria dos casos
- **Flyway**: versionar mudanças no banco como código
- **@Transactional**: operações atômicas (tudo ou nada)
- **BCrypt**: hash seguro de senhas

### TypeScript & Next.js
- **React Hooks**: useState, useEffect, useRouter
- **Client vs Server Components**: quando usar 'use client'
- **fetch() API**: chamadas HTTP assíncronas
- **async/await**: código assíncrono legível
- **TypeScript Interfaces**: contratos de tipos

### Banco de Dados
- **PostgreSQL**: banco relacional robusto
- **Migrations**: versionamento de schema
- **Índices**: performance de queries
- **Foreign Keys**: integridade referencial
- **Soft Delete**: desativar sem apagar (campo `active`)

---

## 🐛 Solucionando problemas

### Não consigo logar
```bash
# Veja os logs do backend
docker compose logs backend --tail=50

# Verifique se o banco subiu
docker compose ps

# Reinicie tudo (sem perder dados)
docker compose restart

# Reinicie apagando tudo (CUIDADO: apaga dados!)
docker compose down -v && docker compose up -d --build
```

### Backend não sobe (erro de migration)
O banco pode ter travado. Verifique:
```bash
docker compose logs postgres --tail=30
```

Se necessário, apague e recrie:
```bash
docker compose down -v  # apaga volumes (dados do banco)
docker compose up -d --build
```

### CORS error no browser
Verifique se o frontend está em `localhost:3000`.
O SecurityConfig.java só permite essa origem.

### Token expirado (401)
Faça login novamente. O token dura 24 horas.

---

## 📝 Notas para desenvolvimento

### Gerar hash BCrypt
Para criar senhas manualmente, use: https://bcrypt-generator.com
- Strength: 12
- Texto: sua senha

### Ver o banco visualmente
Acesse http://localhost:5050 (PgAdmin)
- Email: admin@lumayodontologia.com.br
- Senha: admin123

Conecte ao servidor:
- Host: postgres
- Port: 5432
- Database: lumay_db
- User: lumay_user
- Password: lumay_pass

### Testar a API
Acesse http://localhost:8080/swagger-ui.html
Faça login primeiro, copie o token e clique em "Authorize".
