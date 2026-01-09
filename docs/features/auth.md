# Autenticação — Implementação e Proteção de Rotas

Resumo: autenticação e gerenciamento de sessão via Supabase Auth.

Arquivos chave
- `src/pages/Auth.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/auth/RequireAuth.tsx`

Pontos importantes
- `AuthContext` usa `onAuthStateChange` e `getSession()` do Supabase.
- Proteções de rota usam `RequireAuth` para redirecionar usuários não autenticados.

Recomendações
- Não expor chaves no repositório; configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY` via variáveis de ambiente (veja `.env.example`).
