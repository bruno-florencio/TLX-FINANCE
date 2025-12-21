
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela de Categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  cor TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de categorias" ON public.categorias
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de categorias" ON public.categorias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de categorias" ON public.categorias
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de categorias" ON public.categorias
  FOR DELETE USING (true);

CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Contas (Bancárias e Cartões)
CREATE TABLE public.contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'cartao_credito', 'cartao_debito', 'investimento', 'caixa')),
  banco TEXT,
  agencia TEXT,
  numero_conta TEXT,
  bandeira TEXT,
  limite DECIMAL(15,2) DEFAULT 0,
  saldo_inicial DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_atual DECIMAL(15,2) NOT NULL DEFAULT 0,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de contas" ON public.contas
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de contas" ON public.contas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de contas" ON public.contas
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de contas" ON public.contas
  FOR DELETE USING (true);

CREATE TRIGGER update_contas_updated_at
  BEFORE UPDATE ON public.contas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Centros de Custo
CREATE TABLE public.centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de centros_custo" ON public.centros_custo
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de centros_custo" ON public.centros_custo
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de centros_custo" ON public.centros_custo
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de centros_custo" ON public.centros_custo
  FOR DELETE USING (true);

CREATE TRIGGER update_centros_custo_updated_at
  BEFORE UPDATE ON public.centros_custo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  documento TEXT,
  tipo_documento TEXT CHECK (tipo_documento IN ('cpf', 'cnpj')),
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de fornecedores" ON public.fornecedores
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de fornecedores" ON public.fornecedores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de fornecedores" ON public.fornecedores
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de fornecedores" ON public.fornecedores
  FOR DELETE USING (true);

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Lançamentos (Entradas e Saídas)
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'atrasado')),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  conta_id UUID REFERENCES public.contas(id) ON DELETE SET NULL,
  centro_custo_id UUID REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  numero_documento TEXT,
  observacoes TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de lancamentos" ON public.lancamentos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de lancamentos" ON public.lancamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de lancamentos" ON public.lancamentos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de lancamentos" ON public.lancamentos
  FOR DELETE USING (true);

CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos(tipo);
CREATE INDEX idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX idx_lancamentos_data_vencimento ON public.lancamentos(data_vencimento);
CREATE INDEX idx_lancamentos_categoria_id ON public.lancamentos(categoria_id);
CREATE INDEX idx_lancamentos_conta_id ON public.lancamentos(conta_id);

-- Tabela de Transferências entre Contas
CREATE TABLE public.transferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_origem_id UUID NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  conta_destino_id UUID NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  valor DECIMAL(15,2) NOT NULL,
  data_transferencia DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de transferencias" ON public.transferencias
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de transferencias" ON public.transferencias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de transferencias" ON public.transferencias
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de transferencias" ON public.transferencias
  FOR DELETE USING (true);

CREATE TRIGGER update_transferencias_updated_at
  BEFORE UPDATE ON public.transferencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dados iniciais para Categorias
INSERT INTO public.categorias (nome, tipo, cor) VALUES
  ('Vendas', 'entrada', '#22C55E'),
  ('Serviços', 'entrada', '#3B82F6'),
  ('Investimentos', 'entrada', '#8B5CF6'),
  ('Outros Recebimentos', 'entrada', '#F59E0B'),
  ('Fornecedores', 'saida', '#EF4444'),
  ('Folha de Pagamento', 'saida', '#F97316'),
  ('Impostos', 'saida', '#DC2626'),
  ('Aluguel', 'saida', '#6366F1'),
  ('Utilidades', 'saida', '#0EA5E9'),
  ('Marketing', 'saida', '#EC4899'),
  ('Manutenção', 'saida', '#84CC16'),
  ('Outros Gastos', 'saida', '#6B7280');

-- Dados iniciais para Centros de Custo
INSERT INTO public.centros_custo (nome, descricao) VALUES
  ('Administrativo', 'Despesas administrativas gerais'),
  ('Comercial', 'Vendas e marketing'),
  ('Operacional', 'Operações e produção'),
  ('Financeiro', 'Gestão financeira'),
  ('RH', 'Recursos humanos'),
  ('TI', 'Tecnologia da informação');
