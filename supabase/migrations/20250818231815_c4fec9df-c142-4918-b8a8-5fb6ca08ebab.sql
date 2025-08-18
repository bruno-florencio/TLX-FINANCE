-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.transferencias CASCADE;
DROP TABLE IF EXISTS public.lancamentos CASCADE; 
DROP TABLE IF EXISTS public.entradas CASCADE;
DROP TABLE IF EXISTS public.saidas CASCADE;
DROP TABLE IF EXISTS public.registros CASCADE;
DROP TABLE IF EXISTS public.fornecedores CASCADE;
DROP TABLE IF EXISTS public.contas CASCADE;
DROP TABLE IF EXISTS public.centros_custo CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;

-- Create categorias table
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contas table (bank accounts)
CREATE TABLE public.contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'cartao')),
  banco TEXT,
  agencia TEXT,
  numero_conta TEXT,
  saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create centros_custo table
CREATE TABLE public.centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fornecedores table
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

-- Create main lancamentos table (unified entries)
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_lancamento DATE NOT NULL,
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  categoria_id UUID REFERENCES public.categorias(id),
  conta_id UUID REFERENCES public.contas(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  observacoes TEXT,
  documento TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transferencias table
CREATE TABLE public.transferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_origem_id UUID NOT NULL REFERENCES public.contas(id),
  conta_destino_id UUID NOT NULL REFERENCES public.contas(id),
  valor NUMERIC(15,2) NOT NULL,
  data_transferencia DATE NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'realizada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (adjust as needed for production)
CREATE POLICY "Permitir acesso total a categorias" ON public.categorias FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a contas" ON public.contas FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a centros_custo" ON public.centros_custo FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a fornecedores" ON public.fornecedores FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a lancamentos" ON public.lancamentos FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a transferencias" ON public.transferencias FOR ALL USING (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
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

-- Insert sample data
INSERT INTO public.categorias (nome, tipo, descricao) VALUES
('Vendas', 'entrada', 'Receitas de vendas de produtos e serviços'),
('Investimentos', 'entrada', 'Rendimentos de investimentos'),
('Salários', 'saida', 'Pagamento de salários e benefícios'),
('Fornecedores', 'saida', 'Pagamentos a fornecedores'),
('Marketing', 'saida', 'Gastos com marketing e publicidade'),
('Aluguel', 'saida', 'Pagamento de aluguel e condomínio');

INSERT INTO public.contas (nome, tipo, banco, saldo_inicial) VALUES
('Conta Corrente Principal', 'corrente', 'Banco do Brasil', 25000.00),
('Conta Poupança', 'poupanca', 'Caixa Econômica', 50000.00),
('Conta Investimentos', 'investimento', 'XP Investimentos', 100000.00),
('Cartão Empresarial', 'cartao', 'Santander', 0.00);

INSERT INTO public.centros_custo (nome, descricao) VALUES
('Administrativo', 'Custos administrativos gerais'),
('Vendas', 'Custos relacionados a vendas'),
('Marketing', 'Custos de marketing e publicidade'),
('Operacional', 'Custos operacionais');

INSERT INTO public.fornecedores (nome, documento, email) VALUES
('Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com'),
('Office Supply Co', '98.765.432/0001-10', 'vendas@officesupply.com'),
('Marketing Agency', '11.222.333/0001-44', 'hello@marketingagency.com');

-- Insert sample lancamentos
INSERT INTO public.lancamentos (tipo, descricao, valor, data_lancamento, status, categoria_id, conta_id) 
SELECT 
  'entrada',
  'Venda de serviços - Janeiro',
  15000.00,
  CURRENT_DATE - INTERVAL '10 days',
  'pago',
  c.id,
  ct.id
FROM public.categorias c, public.contas ct
WHERE c.nome = 'Vendas' AND ct.nome = 'Conta Corrente Principal'
LIMIT 1;

INSERT INTO public.lancamentos (tipo, descricao, valor, data_lancamento, data_vencimento, status, categoria_id, conta_id)
SELECT 
  'saida',
  'Pagamento fornecedor Tech Solutions',
  5000.00,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '5 days',
  'pendente',
  c.id,
  ct.id
FROM public.categorias c, public.contas ct
WHERE c.nome = 'Fornecedores' AND ct.nome = 'Conta Corrente Principal'
LIMIT 1;