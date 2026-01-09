# Integrações — Supabase, Capacitor e APIs Externas

Resumo: descreve integrações externas e como configurá-las.

Supabase
- Cliente em `src/integrations/supabase` — recomenda-se ler `docs/core/supabase.md` para políticas e migrations.
- Variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (não commitadas). Veja `.env.example`.

Capacitor
- Arquivo de configuração: `capacitor.config.ts`.
- Passos básicos: `npx cap add android` / `npx cap add ios`, depois `npx cap sync` e `npx cap open android`.

APIs externas
- CEP / geocoding: projeto espera integração com ViaCEP / Nominatim (ver `docs/features/clientes.md`). Documente chaves/limites se aplicável.
