### 1. Objetivo de Negocio

O **D'Cris** e um sistema de **gestao de crediario** (fiado) voltado para pequenos comerciantes, especialmente vendedores ambulantes ou comercios de bairro. O sistema permite:

- **Gerenciar clientes e suas fichas de credito**: Controlar quem deve, quanto deve e historico de transacoes
- **Registrar vendas a prazo**: Cadastrar vendas vinculadas a clientes com produtos e valores
- **Controlar recebimentos**: Registrar pagamentos parciais ou totais dos clientes
- **Gerenciar afiliacoes**: Organizar clientes por pontos de venda/localizacoes (ex: feiras, bairros)
- **Catalogo de produtos**: Manter lista de produtos com precos para facilitar vendas
- **Geolocalizacao inteligente**: Detectar proximidade com afiliacoes/clientes para agilizar o trabalho em campo

### 2. Arquitetura Geral

Frontend (React + Vite + TypeScript)
|
v
Supabase (Backend)

- PostgreSQL Database
- Row Level Security (RLS)
- Auth (Email/Password)

---

### 3. Features Documentadas

#### 3.1 Autenticacao (Auth)

- Login com email/senha
- Cadastro de novos usuarios
- Recuperacao de senha por email
- Protecao de rotas com RequireAuth

#### 3.2 Dashboard

- Visao geral com estatisticas: total de clientes, vendas, recebimentos, saldo
- Acoes rapidas para navegar: Crediario, Produtos, Vendas, Recebimentos

#### 3.3 Crediario (Customer Accounts)

- Lista de fichas de clientes com saldo pendente
- Filtro por afiliacoes
- Pesquisa por nome
- Banner de proximidade (GPS) - detecta clientes/afiliacoes proximos
- Cadastro rapido de clientes e afiliacoes

#### 3.4 Clientes

- Cadastro com: nome, telefone, CPF, email, CEP (auto-preenchimento de endereco)
- Vinculacao a afiliacoes
- Geolocalizacao automatica via CEP (usando ViaCEP + Nominatim)

#### 3.5 Afiliacoes

- Cadastro de pontos de venda/localizacoes
- Endereco com CEP e coordenadas GPS
- Listagem com edicao e exclusao

#### 3.6 Produtos

- Catalogo de produtos com nome, preco e descricao
- Edicao e exclusao de produtos

#### 3.7 Vendas

- Dashboard com estatisticas de vendas
- Criacao de venda com:
  - Selecao/criacao rapida de cliente
  - Adicao de multiplos produtos
  - Calculo automatico de total
  - Captura de localizacao GPS
- Listagem com filtros por status e cliente

#### 3.8 Recebimentos (Payments)

- Visualizacao de saldos pendentes por cliente
- Historico de recebimentos
- Registro de novos recebimentos

#### 3.9 Ficha do Cliente (Account Detail)

- Resumo completo: saldo, total vendas, total recebido
- Informacoes do cliente com opcao de copiar
- Historico de transacoes (vendas + recebimentos)
- Acoes rapidas: nova venda, novo recebimento, editar cliente

---

### 4. Design Patterns da UI

#### 4.1 Layout Mobile-First

- MobileLayout: Container padrao com header, botao voltar e acoes
- Design responsivo otimizado para smartphones
- Touch-friendly com mobile-tap para feedback visual

#### 4.2 Sistema de Navegacao

- Tabs horizontais estilo WhatsApp (MobileTabs)
- Pills/chips para filtros rapidos
- Botao voltar contextual

#### 4.3 Componentes Customizados WhatsApp-Style

- WhatsAppInput: Campos de texto com bordas arredondadas
- WhatsAppSelect: Seletores com visual consistente
- Scroll oculto em tabs (scrollbar-hide)

#### 4.4 Paleta de Cores

- **Light Mode**: Azul primario (#3B82F6), cinzas suaves
- **Dark Mode**: Azul brilhante, fundos escuros
- Estados: verde (sucesso/credito), vermelho (debito/erro)

#### 4.5 Animacoes

- animate-fade-in: Entrada suave
- animate-slide-up: Deslizar para cima
- animate-scale-in: Escala de entrada
- card-hover: Hover com sombra e escala

#### 4.6 Formularios

- Cards com padding consistente
- Labels claros
- Feedback de erro em vermelho
- Botoes full-width no mobile

---

### 5. Fluxos Detalhados (Mermaid)

### 6. Modelo de Dados (Database Schema)

### 7. Seguranca (RLS Policies)

Todas as tabelas possuem **Row Level Security** com politicas RESTRICTIVE:

- SELECT: apenas registros onde user_id = auth.uid()
- INSERT: apenas se user_id = auth.uid() e entidades referenciadas pertencem ao usuario
- UPDATE: mesmo criterio
- DELETE: apenas registros proprios

---

Esta documentacao cobre o projeto completo com seu objetivo de negocio, todas as features, design patterns e fluxos detalhados em formato Mermaid.
