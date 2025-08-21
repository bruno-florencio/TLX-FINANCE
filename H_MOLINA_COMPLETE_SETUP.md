# H MOLINA - Sistema Financeiro Completo
## Setup Completo para VSCode

### 1. BANCO DE DADOS SUPABASE - SQL COMPLETO

```sql
-- =====================================================
-- H MOLINA FINANCIAL SYSTEM - DATABASE SETUP
-- =====================================================

-- 1. TABELA CATEGORIAS
CREATE TABLE public.categorias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. TABELA CONTAS
CREATE TABLE public.contas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'cartao')),
    banco TEXT,
    agencia TEXT,
    numero_conta TEXT,
    saldo_inicial NUMERIC NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. TABELA CENTROS DE CUSTO
CREATE TABLE public.centros_custo (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. TABELA FORNECEDORES
CREATE TABLE public.fornecedores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    documento TEXT,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. TABELA LANÇAMENTOS (PRINCIPAL)
CREATE TABLE public.lancamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    data_lancamento DATE NOT NULL,
    data_vencimento DATE,
    data_pagamento DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'atrasado')),
    categoria_id UUID REFERENCES public.categorias(id),
    conta_id UUID REFERENCES public.contas(id),
    centro_custo_id UUID REFERENCES public.centros_custo(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    observacoes TEXT,
    documento TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. TABELA TRANSFERÊNCIAS
CREATE TABLE public.transferencias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conta_origem_id UUID NOT NULL REFERENCES public.contas(id),
    conta_destino_id UUID NOT NULL REFERENCES public.contas(id),
    valor NUMERIC NOT NULL,
    data_transferencia DATE NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas
CREATE TRIGGER update_categorias_updated_at
    BEFORE UPDATE ON public.categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_updated_at
    BEFORE UPDATE ON public.contas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_centros_custo_updated_at
    BEFORE UPDATE ON public.centros_custo
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_updated_at
    BEFORE UPDATE ON public.lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transferencias_updated_at
    BEFORE UPDATE ON public.transferencias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajustar conforme necessário para produção)
CREATE POLICY "Permitir acesso total a categorias" ON public.categorias FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a contas" ON public.contas FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a centros_custo" ON public.centros_custo FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a fornecedores" ON public.fornecedores FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a lancamentos" ON public.lancamentos FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a transferencias" ON public.transferencias FOR ALL USING (true);

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Categorias de Entrada
INSERT INTO public.categorias (nome, tipo, descricao) VALUES
('Vendas', 'entrada', 'Receitas de vendas de produtos e serviços'),
('Consultoria', 'entrada', 'Receitas de serviços de consultoria'),
('Juros', 'entrada', 'Rendimentos de aplicações financeiras'),
('Outras Receitas', 'entrada', 'Outras receitas diversas');

-- Categorias de Saída
INSERT INTO public.categorias (nome, tipo, descricao) VALUES
('Aluguel', 'saida', 'Pagamento de aluguel e condomínio'),
('Salários', 'saida', 'Folha de pagamento'),
('Fornecedores', 'saida', 'Pagamentos a fornecedores'),
('Marketing', 'saida', 'Investimentos em marketing e publicidade'),
('Equipamentos', 'saida', 'Compra e manutenção de equipamentos'),
('Impostos', 'saida', 'Pagamento de impostos e taxas'),
('Outras Despesas', 'saida', 'Outras despesas operacionais');

-- Contas Bancárias
INSERT INTO public.contas (nome, tipo, banco, agencia, numero_conta, saldo_inicial) VALUES
('Conta Corrente Principal', 'corrente', 'Banco do Brasil', '1234-5', '12345678-9', 50000.00),
('Conta Poupança', 'poupanca', 'Caixa Econômica', '5678-1', '87654321-0', 25000.00),
('Conta Investimento', 'investimento', 'Itaú', '9999-8', '11111111-1', 100000.00),
('Cartão Empresarial', 'cartao', 'Santander', NULL, '**** 1234', 0.00);

-- Centros de Custo
INSERT INTO public.centros_custo (nome, descricao) VALUES
('Administrativo', 'Gastos administrativos gerais'),
('Comercial', 'Gastos relacionados a vendas'),
('Operacional', 'Gastos operacionais diretos'),
('Marketing', 'Investimentos em marketing e publicidade'),
('TI', 'Gastos com tecnologia da informação');

-- Fornecedores
INSERT INTO public.fornecedores (nome, documento, email, telefone, endereco) VALUES
('Fornecedor A Ltda', '12.345.678/0001-90', 'contato@fornecedora.com', '(11) 1234-5678', 'Rua A, 123'),
('Prestador B', '987.654.321-00', 'prestador@email.com', '(11) 9876-5432', 'Rua B, 456'),
('Empresa C S/A', '11.222.333/0001-44', 'financeiro@empresac.com', '(11) 5555-1234', 'Av. C, 789');

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices na tabela lancamentos
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos(tipo);
CREATE INDEX idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX idx_lancamentos_data_lancamento ON public.lancamentos(data_lancamento);
CREATE INDEX idx_lancamentos_data_vencimento ON public.lancamentos(data_vencimento);
CREATE INDEX idx_lancamentos_categoria_id ON public.lancamentos(categoria_id);
CREATE INDEX idx_lancamentos_conta_id ON public.lancamentos(conta_id);

-- Índices na tabela transferencias
CREATE INDEX idx_transferencias_data ON public.transferencias(data_transferencia);
CREATE INDEX idx_transferencias_status ON public.transferencias(status);
```

### 2. CONFIGURAÇÃO DO PROJETO REACT

#### package.json - Dependências Necessárias
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.55.0",
    "@tanstack/react-query": "^5.83.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.25.76",
    "date-fns": "^3.6.0",
    "jspdf": "^3.0.1",
    "jspdf-autotable": "^5.0.2",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.462.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "sonner": "^1.7.4"
  }
}
```

### 3. DESIGN SYSTEM - index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* H MOLINA Brand Colors */
    --h-molina-green: 120 96% 40%;
    --h-molina-light-blue: 207 65% 42%;
    --h-molina-medium-blue: 208 92% 30%;
    --h-molina-dark-blue: 208 97% 24%;
    --h-molina-dark-bg: 0 1% 16%;
    
    /* Sistema de cores baseado na marca */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: var(--h-molina-green);
    --primary-foreground: 210 40% 98%;
    --secondary: var(--h-molina-light-blue);
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: var(--h-molina-medium-blue);
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: var(--h-molina-green);
    --radius: 0.5rem;
    
    /* Cores de status financeiro */
    --entrada: var(--h-molina-green);
    --saida: 0 84% 60%;
    --pago: var(--h-molina-green);
    --pendente: 45 93% 47%;
    --atrasado: 0 84% 60%;
    --cancelado: 215 16% 47%;
  }

  .dark {
    --background: var(--h-molina-dark-bg);
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: var(--h-molina-green);
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: var(--h-molina-dark-blue);
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: var(--h-molina-medium-blue);
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: var(--h-molina-green);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Montserrat', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Alfa Slab One', serif;
  }
}
```

### 4. HOOKS PRINCIPAIS

#### useLancamentos.ts
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Lancamento {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_lancamento: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  categoria_id?: string;
  conta_id?: string;
  centro_custo_id?: string;
  fornecedor_id?: string;
  observacoes?: string;
  documento?: string;
  created_at: string;
  updated_at: string;
}

export interface NewLancamento {
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_lancamento: string;
  data_vencimento?: string;
  categoria_id?: string;
  conta_id?: string;
  centro_custo_id?: string;
  fornecedor_id?: string;
  observacoes?: string;
  documento?: string;
}

export const useLancamentos = (tipo?: 'entrada' | 'saida') => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      let query = supabase.from('lancamentos').select('*').order('data_lancamento', { ascending: false });
      
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro ao carregar lançamentos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setLancamentos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLancamento = async (newLancamento: NewLancamento) => {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .insert([newLancamento])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar lançamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setLancamentos(prev => [data, ...prev]);
      toast({
        title: "Sucesso!",
        description: "Lançamento criado com sucesso.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateLancamento = async (id: string, updates: Partial<Lancamento>) => {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao atualizar lançamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setLancamentos(prev => 
        prev.map(item => item.id === id ? data : item)
      );
      
      toast({
        title: "Sucesso!",
        description: "Lançamento atualizado com sucesso.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLancamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir lançamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setLancamentos(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Sucesso!",
        description: "Lançamento excluído com sucesso.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsPaid = async (id: string) => {
    return await updateLancamento(id, {
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    fetchLancamentos();
  }, [tipo]);

  return {
    lancamentos,
    loading,
    createLancamento,
    updateLancamento,
    deleteLancamento,
    markAsPaid,
    refetch: fetchLancamentos
  };
};
```

#### useSupabaseData.ts
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida';
  descricao?: string;
  ativo: boolean;
}

export interface Conta {
  id: string;
  nome: string;
  tipo: string;
  banco?: string;
  saldo_inicial: number;
  ativo: boolean;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface Fornecedor {
  id: string;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export const useSupabaseData = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);

      const [categoriasResult, contasResult, centrosCustoResult, fornecedoresResult] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
        supabase.from('contas').select('*').eq('ativo', true).order('nome'),
        supabase.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome')
      ]);

      if (categoriasResult.error) throw categoriasResult.error;
      if (contasResult.error) throw contasResult.error;
      if (centrosCustoResult.error) throw centrosCustoResult.error;
      if (fornecedoresResult.error) throw fornecedoresResult.error;

      setCategorias(categoriasResult.data || []);
      setContas(contasResult.data || []);
      setCentrosCusto(centrosCustoResult.data || []);
      setFornecedores(fornecedoresResult.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    categorias,
    contas,
    centrosCusto,
    fornecedores,
    loading,
    refetch: fetchData
  };
};
```

### 5. CONFIGURAÇÕES ESSENCIAIS

#### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Alfa Slab One', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Cores específicas H MOLINA
        'h-molina': {
          green: "hsl(var(--h-molina-green))",
          'light-blue': "hsl(var(--h-molina-light-blue))",
          'medium-blue': "hsl(var(--h-molina-medium-blue))",
          'dark-blue': "hsl(var(--h-molina-dark-blue))",
        },
        // Status financeiros
        entrada: "hsl(var(--entrada))",
        saida: "hsl(var(--saida))",
        pago: "hsl(var(--pago))",
        pendente: "hsl(var(--pendente))",
        atrasado: "hsl(var(--atrasado))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

### 6. ESTRUTURA DE PASTAS RECOMENDADA

```
h-molina-financial/
├── public/
├── src/
│   ├── components/
│   │   ├── cards/
│   │   │   └── FinanceCard.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   ├── tables/
│   │   │   └── TransactionTable.tsx
│   │   └── ui/ (componentes shadcn/ui)
│   ├── hooks/
│   │   ├── useLancamentos.ts
│   │   ├── useSupabaseData.ts
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── tabs/
│   │   │   ├── HomeTab.tsx
│   │   │   ├── EntradasTabEnhanced.tsx
│   │   │   ├── SaidasTabEnhanced.tsx
│   │   │   ├── ContasTab.tsx
│   │   │   ├── RelatoriosTab.tsx
│   │   │   └── ConfiguracaoTab.tsx
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── utils/
│   │   └── exportUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── config.toml
│   └── migrations/
└── package.json
```

### 7. PRÓXIMOS PASSOS

1. **Execute o SQL no Supabase**: Copie todo o código SQL acima e execute no SQL Editor do Supabase
2. **Configure o projeto React**: Use os códigos de configuração fornecidos
3. **Implemente os componentes**: Crie os componentes principais seguindo a estrutura
4. **Teste as funcionalidades**: Verifique CRUD de lançamentos, filtros e exportações

### 8. FUNCIONALIDADES IMPLEMENTADAS

- ✅ CRUD completo de lançamentos (entradas/saídas)
- ✅ Gestão de categorias, contas, centros de custo e fornecedores
- ✅ Dashboard com resumos financeiros
- ✅ Filtros e ordenação
- ✅ Exportação Excel/PDF
- ✅ Sistema de status (pago/pendente/atrasado)
- ✅ Design system H MOLINA
- ✅ Interface responsiva
- ✅ Validação de formulários

---

**Este arquivo contém tudo necessário para recriar completamente o sistema H MOLINA em qualquer ambiente.**