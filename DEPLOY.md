# Deploy na VPS — passo a passo

Duas opções abaixo, conforme o que a VPS da empresa tem instalado.
Se não souber, rode `which coolify 2>/dev/null; docker ps | grep -i coolify`
no servidor — se aparecer algo, é a Opção A.

## Antes de qualquer opção: ter em mãos

Ver `VARIAVEIS-DE-AMBIENTE-VPS.md` para o que cada uma significa.

- `DATABASE_URL` (connection string do Supabase, modo "Transaction pooler")
- `SESSION_SECRET` (`openssl rand -hex 32`)
- `GEMINI_API_KEY`
- `MASTER_USUARIO` / `MASTER_SENHA` (login do primeiro acesso)

---

## Opção A — VPS com Coolify

1. **Novo projeto**: Coolify → Projects → + New → nome "Vizze Compras".
2. **Nova aplicação** dentro do projeto: + New Resource → Application →
   Public/Private Repository (GitHub) → selecione o repositório da
   empresa, branch `main`.
3. **Build pack**: Dockerfile (Coolify detecta o `Dockerfile` na raiz
   automaticamente — não precisa configurar build/start command).
4. **Porta**: 3000 (já exposta no `Dockerfile`/`docker-compose.yml`).
5. **Environment Variables**: adicione as 5 variáveis da lista acima.
   Marque como "Runtime" (não precisa de nenhuma em build time).
6. **Domínio**: em Settings → Domains, coloque o domínio da empresa
   (ex.: `compras.suaempresa.com.br`) com `https://` na frente — o
   Coolify emite o certificado Let's Encrypt sozinho. **Não pule isso**:
   sem HTTPS de verdade o login não funciona (cookie de sessão é
   `secure`) e a gravação de áudio na requisição também não.
7. **Deploy**: clique em Deploy. Acompanhe os logs — na primeira subida
   ele aplica as migrações do banco e cria o usuário Master
   automaticamente (ver `server/db/seed.ts`).
8. Teste: abra a URL, faça login com `MASTER_USUARIO`/`MASTER_SENHA`.

## Opção B — VPS "crua" (Docker Compose direto, sem painel)

Pressupõe Docker e Docker Compose já instalados no servidor, e um
proxy reverso com HTTPS na frente (Caddy, Nginx+certbot, Traefik —
qualquer um; o container da aplicação só escuta HTTP na porta 3000,
quem termina TLS é o proxy). **Sem HTTPS de verdade, o login não
funciona** (cookie `secure`) nem a gravação de áudio na requisição.

1. No servidor:
   ```bash
   git clone https://github.com/<org-da-empresa>/<repo>.git vizze-compras
   cd vizze-compras
   ```
2. Crie o arquivo `.env` (mesma pasta do `docker-compose.yml`, nunca
   commitado):
   ```bash
   cat > .env <<'EOF'
   DATABASE_URL=postgresql://usuario:senha@host:6543/postgres
   SESSION_SECRET=cole-aqui-o-valor-do-openssl-rand
   GEMINI_API_KEY=cole-aqui
   MASTER_USUARIO=mastervizze
   MASTER_SENHA=escolha-uma-senha-forte
   EOF
   ```
3. Suba:
   ```bash
   docker compose up -d --build
   ```
4. Acompanhe a primeira subida (aplica migração + cria o Master):
   ```bash
   docker compose logs -f app
   ```
5. Configure seu proxy reverso apontando `https://<domínio>` para
   `http://127.0.0.1:3000` do servidor (exemplo com Caddy, só 3
   linhas num `Caddyfile`):
   ```
   compras.suaempresa.com.br {
       reverse_proxy localhost:3000
   }
   ```
6. Teste: abra `https://compras.suaempresa.com.br`, faça login com
   `MASTER_USUARIO`/`MASTER_SENHA`.

---

## Depois do primeiro deploy, em qualquer opção

- **Troque a senha do Master** assim que logar (ainda não existe tela
  de "trocar minha senha" — se precisar, me avise que eu adiciono).
- Cadastre as obras, fornecedores e usuários reais da empresa pela
  própria aplicação (Usuários → Novo usuário, etc.) — não existe
  importação em massa ainda.
- Deploys seguintes: só um novo `git push` (Coolify redeploya sozinho
  se tiver webhook configurado) ou `docker compose up -d --build` de
  novo (Opção B) — as migrações rodam sozinhas a cada subida e são
  seguras de repetir (não duplicam nada já aplicado).
