# Supabase — Schema, Migrations e RLS

Resumo: o backend é Supabase (Postgres). Todas as tabelas usam Row Level Security (RLS) com políticas restritivas (usuário só vê seus próprios registros via `user_id = auth.uid()`).

Arquivos chave

- `supabase/config.toml`
- `supabase/migrations/` (arquivos `YYYYMMDDHHMMSS_<uuid>.sql`)
- `src/integrations/supabase/*`

Fluxo de alteração de schema

1. Criar migration local: `supabase migration new "desc"` (CLI Supabase).
2. Verificar SQL e commitar o arquivo em `supabase/migrations`.
3. No PR, documentar impacto em RLS e testes manuais necessários.

RLS — notas práticas

- Políticas restringem `SELECT/UPDATE/DELETE` por `user_id = auth.uid()`.
- Ao introduzir colunas relacionadas a `user_id` garanta backfill ou migrations apropriadas.
