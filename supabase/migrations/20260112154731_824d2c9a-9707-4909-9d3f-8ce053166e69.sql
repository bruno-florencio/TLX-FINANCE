-- Adicionar campo ativo na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Adicionar campo email na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS email text;

-- Adicionar campo telefone na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS telefone text;

-- Adicionar campo documento na tabela clientes (CPF/CNPJ)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS documento text;

-- Adicionar campo updated_at na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_workspace_ativo ON public.clientes(workspace_id, ativo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_workspace_ativo ON public.fornecedores(workspace_id, ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_workspace_tipo ON public.categorias(workspace_id, tipo);
CREATE INDEX IF NOT EXISTS idx_centros_custo_workspace_ativo ON public.centros_custo(workspace_id, ativo);