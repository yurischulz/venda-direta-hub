# GPS e Geolocalização — Nativo e Web

Resumo: captura de localização usando Capacitor (nativo) e `navigator.geolocation` no web fallback.

Arquivos chave
- `src/hooks/useGeolocation.ts`
- `src/pages/GpsDemo.tsx`
- `capacitor.config.ts`

Diferenças nativo vs web
- Nativo (Capacitor): maior precisão e permissões via Android/iOS; configurar permissões no `AndroidManifest` e `Info.plist`.
- Web: usar `navigator.geolocation` com permissões do browser; menos confiável em dispositivos móveis.

Checklist para testes em device
- Conceder permissão de localização.
- Verificar banner de proximidade em `CustomerAccounts`.
- Testar captura de localização ao criar venda.
