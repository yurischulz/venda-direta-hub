# Afiliações — Pontos de Venda

Resumo: cadastro de pontos de venda com endereço e coordenadas, usados como filtro e para cálculo de proximidade.

Arquivos chave

- `src/pages/Affiliations.tsx`
- `src/pages/AffiliationNew.tsx`
- `src/components/AffiliationsList.tsx`

Observações

- Armazenar CEP e coordenadas; use CEP para preencher endereço e Nominatim/Geocoding para lat/lng se necessário.
- Afiliações são usadas por filtros em `CustomerAccounts` e `Sales`.
