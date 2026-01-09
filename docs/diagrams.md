## Diagramas (Mermaid)

Abaixo estão os diagramas principais usados na documentação. Cole-os em um renderizador Mermaid para visualizar.

### 1) Fluxo de Autenticação

```mermaid
sequenceDiagram
  participant App
  participant AuthContext
  participant SupabaseAuth
  App->>AuthContext: Inicializa Provider
  AuthContext->>SupabaseAuth: subscribe onAuthStateChange
  App->>SupabaseAuth: getSession()
  SupabaseAuth-->>AuthContext: session/user
  AuthContext-->>App: fornece user/session
  App->>AuthContext: signOut()
  AuthContext->>SupabaseAuth: signOut()
```

### 2) Fluxo de Criação de Venda

```mermaid
sequenceDiagram
  participant UI
  participant SaleForm
  participant Supabase
  participant QueryClient
  UI->>SaleForm: submit(venda)
  SaleForm->>Supabase: insert sales, sale_items
  Supabase-->>SaleForm: 201/obj
  SaleForm->>Supabase: opcional: call function recalc_customer_account
  SaleForm->>QueryClient: invalidateQueries(['sales','customer-accounts','dashboard-stats'])
  QueryClient-->>UI: refetch/update views
```

### 3) Fluxo de Proximidade (GPS → Banner)

```mermaid
flowchart LR
  A[Componente CustomerAccounts] --> B[useGeolocation.getCurrentPosition]
  B --> C{Capacitor Native?}
  C -- Sim --> D[Capacitor Geolocation]
  C -- Não --> E[navigator.geolocation]
  D & E --> F[Calcular distâncias com utilitários]
  F --> G[Se nearby>0 -> mostrar ProximityBanner]
```

### 4) Modelo de Dados (ER simplificado)

```mermaid
erDiagram
  AFFILIATIONS ||--o{ CLIENTS : has
  CLIENTS ||--o{ CUSTOMER_ACCOUNTS : has
  CLIENTS ||--o{ SALES : has
  SALES ||--o{ SALE_ITEMS : has
  CLIENTS ||--o{ PAYMENTS : has
```

### 5) Cache & QueryClient (lifecycle)

```mermaid
sequenceDiagram
  participant QueryClient
  participant LocalStorage
  QueryClient->>LocalStorage: saveCache(on change)
  LocalStorage-->>QueryClient: restoreCache(on init)
  UI->>QueryClient: prefetchImportantData
```
