-- Create contas table for bank accounts
CREATE TABLE public.contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'cartao')),
  banco TEXT,
  agencia TEXT,
  numero_conta TEXT,
  saldo_inicial NUMERIC DEFAULT 0,
  saldo_atual NUMERIC DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categorias table
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  cor TEXT DEFAULT 'blue',
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create centros_custo table
CREATE TABLE public.centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT 'blue',
  ativo BOOLEAN DEFAULT true,
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
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to lancamentos table
ALTER TABLE public.lancamentos 
ADD COLUMN conta_id UUID REFERENCES public.contas(id),
ADD COLUMN centro_custo_id UUID REFERENCES public.centros_custo(id),
ADD COLUMN fornecedor_id UUID REFERENCES public.fornecedores(id),
ADD COLUMN data_vencimento DATE,
ADD COLUMN data_pagamento DATE,
ADD COLUMN observacoes TEXT,
ADD COLUMN numero_documento TEXT;

-- Create transferencias table for account transfers
CREATE TABLE public.transferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_origem_id UUID NOT NULL REFERENCES public.contas(id),
  conta_destino_id UUID NOT NULL REFERENCES public.contas(id),
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now since no auth is implemented)
CREATE POLICY "Allow all operations on contas" ON public.contas FOR ALL USING (true);
CREATE POLICY "Allow all operations on categorias" ON public.categorias FOR ALL USING (true);
CREATE POLICY "Allow all operations on centros_custo" ON public.centros_custo FOR ALL USING (true);
CREATE POLICY "Allow all operations on fornecedores" ON public.fornecedores FOR ALL USING (true);
CREATE POLICY "Allow all operations on transferencias" ON public.transferencias FOR ALL USING (true);
CREATE POLICY "Allow all operations on lancamentos" ON public.lancamentos FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_contas_updated_at
  BEFORE UPDATE ON public.contas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias
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

CREATE TRIGGER update_transferencias_updated_at
  BEFORE UPDATE ON public.transferencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.categorias (nome, tipo, cor) VALUES
('Vendas', 'entrada', 'green'),
('Serviços', 'entrada', 'blue'),
('Investimentos', 'entrada', 'purple'),
('Aluguel', 'saida', 'red'),
('Suprimentos', 'saida', 'yellow'),
('Utilidades', 'saida', 'cyan'),
('Tecnologia', 'saida', 'indigo');

INSERT INTO public.centros_custo (nome, descricao, cor) VALUES
('Administrativo', 'Despesas administrativas e gestão', 'blue'),
('Comercial', 'Vendas e marketing', 'green'),
('Produção', 'Custos de produção e fabricação', 'orange'),
('Financeiro', 'Operações financeiras', 'purple'),
('TI', 'Tecnologia da informação', 'indigo'),
('RH', 'Recursos humanos', 'pink');

INSERT INTO public.contas (nome, tipo, banco, saldo_inicial, saldo_atual) VALUES
('Conta Corrente Principal', 'corrente', 'Banco do Brasil', 10000.00, 10000.00),
('Conta Poupança', 'poupanca', 'Itaú', 25000.00, 25000.00),
('Conta Investimentos', 'investimento', 'XP Investimentos', 50000.00, 50000.00);

INSERT INTO public.fornecedores (nome, documento, email, telefone) VALUES
('Fornecedor ABC Ltda', '12.345.678/0001-90', 'contato@abc.com.br', '(11) 9999-9999'),
('Serviços XYZ', '98.765.432/0001-10', 'vendas@xyz.com.br', '(21) 8888-8888'),
('Tech Solutions', '11.222.333/0001-44', 'suporte@tech.com.br', '(31) 7777-7777');