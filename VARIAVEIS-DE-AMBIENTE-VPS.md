# Variáveis de ambiente — configurar na VPS

Este arquivo **não é lido pela aplicação** — é só a referência de tudo
que precisa ser criado como variável de ambiente (ou em um arquivo
`.env` ao lado do `docker-compose.yml`, nunca commitado) na VPS da
empresa. Nenhum valor real deve aparecer aqui nem no `.env.example`.

## Obrigatórias

| Variável | O que é | Onde conseguir |
|---|---|---|
| `DATABASE_URL` | Connection string do Postgres | Painel do Supabase → Project Settings → Database → Connection string → modo **Transaction pooler** (porta 6543). Formato: `postgresql://usuario:senha@host:6543/postgres` |
| `SESSION_SECRET` | Chave que assina o cookie de sessão do login | Gere uma string aleatória longa: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Chave da IA que lê requisição/cotação (documento, foto, áudio) | https://aistudio.google.com/apikey |
| `MASTER_USUARIO` | Nome de usuário do primeiro acesso (perfil Master) | Você escolhe — ex.: `mastervizze` |
| `MASTER_SENHA` | Senha do primeiro acesso | Você escolhe — troque depois do primeiro login |

## Opcionais

| Variável | O que é | Padrão se não definida |
|---|---|---|
| `PORT` | Porta que o servidor escuta dentro do container | `3000` |

## Observações importantes

- **`MASTER_USUARIO`/`MASTER_SENHA` só criam a conta Master na
  PRIMEIRA vez** que o servidor sobe com um banco vazio — depois disso
  pode trocar a senha pelo próprio sistema; as variáveis podem
  continuar aí sem efeito, ou serem removidas.
- **Nunca** coloque os valores reais destas variáveis em nenhum
  arquivo versionado (`git`) — sempre direto na configuração da VPS
  (ou no `.env` local ao `docker-compose.yml`, que deve estar no
  `.gitignore`).
- O domínio público da aplicação precisa ser **HTTPS de verdade**
  (certificado válido, não um domínio tipo `sslip.io` sem TLS) — o
  cookie de sessão é marcado `secure` em produção e o navegador o
  descarta sem HTTPS; a gravação de áudio na requisição também exige
  contexto seguro.
- As migrações do banco (`server/db/migrations/`) rodam sozinhas
  quando o container sobe — não precisa rodar nada manualmente antes.
