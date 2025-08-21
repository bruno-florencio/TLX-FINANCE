# H MOLINA - Sistema de Gestão Financeira
## Estrutura do Projeto

```
h-molina-financial/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── cards/
│   │   │   └── FinanceCard.tsx                 # Card para exibir informações financeiras
│   │   ├── layout/
│   │   │   └── Header.tsx                      # Cabeçalho com navegação por tabs
│   │   ├── tables/
│   │   │   └── TransactionTable.tsx            # Tabela de transações com ordenação
│   │   └── ui/                                 # Componentes shadcn/ui
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx                      # Hook para detecção mobile
│   │   ├── use-toast.ts                        # Hook para toast notifications
│   │   ├── useLancamentos.ts                   # Hook para gerenciar lançamentos
│   │   └── useSupabaseData.ts                  # Hook para dados do Supabase
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts                       # Cliente Supabase configurado
│   │       └── types.ts                        # Tipos TypeScript do banco
│   │
│   ├── lib/
│   │   └── utils.ts                            # Utilitários (cn function)
│   │
│   ├── pages/
│   │   ├── tabs/
│   │   │   ├── ConfiguracaoTab.tsx             # Tab de configurações
│   │   │   ├── ContasTab.tsx                   # Tab de contas bancárias
│   │   │   ├── EntradasTab.tsx                 # Tab de entradas (versão simples)
│   │   │   ├── EntradasTabEnhanced.tsx         # Tab de entradas (versão completa)
│   │   │   ├── HomeTab.tsx                     # Tab inicial com dashboard
│   │   │   ├── RelatoriosTab.tsx               # Tab de relatórios
│   │   │   ├── SaidasTab.tsx                   # Tab de saídas (versão simples)
│   │   │   └── SaidasTabEnhanced.tsx           # Tab de saídas (versão completa)
│   │   ├── Index.tsx                           # Página principal
│   │   └── NotFound.tsx                        # Página 404
│   │
│   ├── utils/
│   │   └── exportUtils.ts                      # Utilitários para exportar Excel/PDF
│   │
│   ├── App.css                                 # Estilos CSS específicos
│   ├── App.tsx                                 # Componente raiz da aplicação
│   ├── index.css                               # Estilos globais e design system
│   ├── main.tsx                                # Ponto de entrada React
│   └── vite-env.d.ts                          # Tipos Vite
│
├── supabase/
│   ├── migrations/                             # Migrações do banco de dados
│   └── config.toml                            # Configuração do Supabase
│
├── .env                                        # Variáveis de ambiente
├── .gitignore                                  # Arquivos ignorados pelo Git
├── bun.lockb                                   # Lock file do Bun
├── components.json                             # Configuração shadcn/ui
├── eslint.config.js                           # Configuração ESLint
├── index.html                                  # HTML principal
├── package.json                                # Dependências e scripts
├── postcss.config.js                          # Configuração PostCSS
├── README.md                                   # Documentação do projeto
├── tailwind.config.ts                         # Configuração Tailwind CSS
├── tsconfig.app.json                          # TypeScript config para app
├── tsconfig.json                               # TypeScript config principal
├── tsconfig.node.json                         # TypeScript config para Node
└── vite.config.ts                             # Configuração Vite
```

## Tecnologias Principais

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado servidor

### Backend/Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication (preparado)

### Bibliotecas Utilitárias
- **date-fns** - Manipulação de datas
- **jsPDF** - Geração de PDFs
- **xlsx** - Exportação Excel
- **lucide-react** - Ícones
- **react-hook-form** - Formulários
- **zod** - Validação de schemas

## Estrutura do Banco de Dados

### Tabelas Principais

#### `categorias`
- **Função**: Categorização de entradas e saídas
- **Campos**: id, nome, tipo (entrada/saida), descricao, ativo
- **Uso**: Classificar receitas e despesas

#### `contas`
- **Função**: Contas bancárias e cartões
- **Campos**: id, nome, tipo, banco, agencia, numero_conta, saldo_inicial
- **Uso**: Controlar origens e destinos dos valores

#### `centros_custo`
- **Função**: Centros de custo para departamentalização
- **Campos**: id, nome, descricao, ativo
- **Uso**: Alocar custos por departamento/projeto

#### `fornecedores`
- **Função**: Cadastro de fornecedores
- **Campos**: id, nome, documento, email, telefone, endereco
- **Uso**: Identificar origem das despesas

#### `lancamentos`
- **Função**: Lançamentos financeiros principais
- **Campos**: id, tipo, descricao, valor, datas, status, referências FK
- **Uso**: Registrar todas as movimentações financeiras

#### `transferencias`
- **Função**: Transferências entre contas
- **Campos**: id, conta_origem_id, conta_destino_id, valor, data
- **Uso**: Movimentações internas entre contas

## Funcionalidades Implementadas

### 🏠 Dashboard (HomeTab)
- Cards resumo financeiro
- Visão geral das movimentações
- Estatísticas principais

### 💰 Gestão de Entradas (EntradasTabEnhanced)
- Cadastro de receitas
- Edição de lançamentos
- Marcação como pago/pendente
- Filtros e ordenação
- Exportação Excel/PDF

### 💸 Gestão de Saídas (SaidasTabEnhanced)
- Cadastro de despesas
- Controle de fornecedores
- Status de pagamento
- Filtros e relatórios
- Exportação de dados

### 🏦 Contas Bancárias (ContasTab)
- Cadastro de contas
- Saldos e movimentações
- Diferentes tipos de conta

### 📊 Relatórios (RelatoriosTab)
- Relatórios financeiros
- Exportação em múltiplos formatos
- Filtros por período

### ⚙️ Configurações (ConfiguracaoTab)
- Configurações do sistema
- Cadastros auxiliares
- Preferências

## Design System H MOLINA

### Paleta de Cores
```css
/* Brand Colors */
--h-molina-green: 120 96% 40%        /* Verde principal */
--h-molina-light-blue: 207 65% 42%   /* Azul claro */
--h-molina-medium-blue: 208 92% 30%  /* Azul médio */
--h-molina-dark-blue: 208 97% 24%    /* Azul escuro */
--h-molina-dark-bg: 0 1% 16%         /* Fundo escuro */

/* Status Colors */
--entrada: var(--h-molina-green)     /* Verde para entradas */
--saida: 0 84% 60%                   /* Vermelho para saídas */
--pago: var(--h-molina-green)        /* Verde para pago */
--pendente: 45 93% 47%               /* Amarelo para pendente */
--atrasado: 0 84% 60%                /* Vermelho para atrasado */
```

### Tipografia
- **Títulos**: Alfa Slab One (serif)
- **Texto**: Montserrat (sans-serif)

## Hooks Personalizados

### `useLancamentos(tipo?)`
- Gerencia CRUD completo de lançamentos
- Filtragem por tipo (entrada/saida)
- Estados de loading e error
- Funções: create, update, delete, markAsPaid

### `useSupabaseData()`
- Carrega dados auxiliares (categorias, contas, etc.)
- Cache automático
- Função de refetch

## Componentes Principais

### `FinanceCard`
- Cards informativos financeiros
- Diferentes tipos e estilos
- Indicadores de mudança

### `TransactionTable`
- Tabela completa de transações
- Ordenação por colunas
- Ações inline (editar, excluir, pagar)
- Filtros integrados

### `Header`
- Navegação principal por tabs
- Responsivo (mobile/desktop)
- Logo e branding

## Fluxo de Dados

1. **Carregamento**: Hooks fazem fetch dos dados do Supabase
2. **Exibição**: Componentes renderizam os dados em tabelas/cards
3. **Interação**: Usuário cria/edita através de formulários
4. **Persistência**: Hooks enviam mudanças para Supabase
5. **Atualização**: Interface reflete automaticamente as mudanças

## Próximos Passos Sugeridos

### Funcionalidades
- [ ] Sistema de autenticação
- [ ] Dashboard mais avançado com gráficos
- [ ] Conciliação bancária
- [ ] Planejamento orçamentário
- [ ] Alertas e notificações
- [ ] Backup/restore de dados

### Melhorias Técnicas
- [ ] Testes unitários
- [ ] Internacionalização (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Optimização de performance
- [ ] Validação de formulários aprimorada

### UX/UI
- [ ] Tema claro/escuro toggle
- [ ] Animações de transição
- [ ] Atalhos de teclado
- [ ] Tutorial/onboarding
- [ ] Feedback visual aprimorado

---

**Desenvolvido com ❤️ usando Lovable AI**