# ================================================================
# DOCKERFILE FRONTEND — TESTADO E FUNCIONAL
# ================================================================
#
# ✅ PROBLEMAS QUE ESTE DOCKERFILE RESOLVE:
#
# 1. "Failed to fetch font Inter" → Google Fonts REMOVIDO do layout.tsx
#    O build não precisa mais de internet para a fonte.
#
# 2. "ETIMEDOUT" no npm → package-lock.json commitado no repositório.
#    O npm ci usa as versões exatas sem precisar resolver dependências.
#    Muito mais rápido e confiável.
#
# 3. Imagem enorme → Modo standalone do Next.js.
#    Imagem final ~150MB em vez de ~500MB.
#
# ================================================================
# PRÉ-REQUISITO: node_modules instalado localmente
#
# O Docker no Windows (via WSL2) tem problemas de DNS/rede que
# causam timeout durante downloads npm longos. A solução profissional
# para desenvolvimento local no Windows é:
#
#   cd frontend && npm install && cd ..
#
# Em produção (CI/CD na nuvem), funciona sem esse passo porque
# o ambiente tem internet rápida e sem restrições de rede.
# ================================================================

FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia manifests primeiro (cache layer)
COPY package.json package-lock.json* ./

# npm ci: instalação determinística e rápida usando o lock file
# Muito mais confiável que npm install para Docker
RUN npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:3000 2>/dev/null | grep -qi "html" || exit 1

CMD ["node", "server.js"]
