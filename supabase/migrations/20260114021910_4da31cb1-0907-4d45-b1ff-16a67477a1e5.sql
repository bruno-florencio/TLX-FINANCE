-- Adicionar coluna ativo na tabela categorias
ALTER TABLE public.categorias ADD COLUMN ativo boolean NOT NULL DEFAULT true;

-- Criar índice para performance
CREATE INDEX idx_categorias_ativo ON public.categorias(ativo);
CREATE INDEX idx_categorias_workspace_ativo ON public.categorias(workspace_id, ativo);