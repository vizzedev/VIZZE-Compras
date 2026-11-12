# DMC:    VIZ-00-00-00-900B
# Título: Núcleo › Imagem Docker de produção
# BREX:   VIZ-00-00-00-022A
#
# Duas etapas: a primeira builda o front-end (vite build -> dist/) e
# descarta tudo que só serve pra isso (devDependencies, node_modules de
# build); a segunda só tem o necessário pra RODAR (server/, dist/,
# node_modules de produção) — imagem final bem menor. O servidor roda
# com `tsx` direto (sem etapa de compilação do TypeScript do servidor)
# porque simplifica o Dockerfile e o custo de partida é insignificante
# nesse tamanho de app.

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS producao
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx --no-save
COPY server ./server
COPY drizzle.config.ts ./
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
