-- =====================================================
-- SISTEMA DE AUTENTICAÇÃO MULTI-TENANT COMPLETO
-- =====================================================

-- 1. Criar enum para roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar enum para tipo de documento
DO $$ BEGIN
  CREATE TYPE public.document_type AS ENUM ('cpf', 'cnpj');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Criar enum para status do usuário
DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'pending', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Criar extensão pgcrypto para hash de documentos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 5. Criar tabela de usuários internos
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document_type public.document_type NOT NULL,
  document_hash TEXT NOT NULL, -- Hash do documento (CPF/CNPJ)
  trade_name TEXT, -- Nome fantasia (PJ)
  birth_date DATE, -- Data nascimento (PF)
  role public.app_role NOT NULL DEFAULT 'user',
  status public.user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT users_workspace_fk FOREIGN KEY (workspace_id) 
    REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON public.users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_document_hash ON public.users(document_hash);

-- 7. Adicionar coluna created_by_user_id na tabela workspaces se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'workspaces' 
    AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN created_by_user_id UUID;
  END IF;
END $$;

-- 8. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. Função SECURITY DEFINER para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(p_auth_user_id UUID, p_workspace_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users
  WHERE auth_user_id = p_auth_user_id
    AND workspace_id = p_workspace_id
    AND status = 'active'
  LIMIT 1;
$$;

-- 10. Função para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_master(p_workspace_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
      AND role = 'master'
      AND status = 'active'
  );
$$;

-- 11. Função para verificar se usuário é admin ou master
CREATE OR REPLACE FUNCTION public.is_admin_or_master(p_workspace_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
      AND role IN ('master', 'admin')
      AND status = 'active'
  );
$$;

-- 12. Função para obter o internal user_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_internal_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- 13. Função para obter workspace_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.users
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- 14. Políticas RLS para tabela users

-- Usuários podem ver outros usuários do mesmo workspace
CREATE POLICY "users_select_same_workspace" ON public.users
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Apenas master pode inserir novos usuários
CREATE POLICY "users_insert_master_only" ON public.users
FOR INSERT
WITH CHECK (
  public.is_master(workspace_id)
  OR NOT EXISTS (SELECT 1 FROM public.users WHERE workspace_id = users.workspace_id)
);

-- Usuários podem atualizar seus próprios dados básicos
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (
  auth_user_id = auth.uid() 
  AND (
    -- Não pode mudar o próprio role a menos que seja o único master
    role = (SELECT role FROM public.users WHERE id = users.id)
    OR public.is_master(workspace_id)
  )
);

-- Master pode atualizar outros usuários do workspace
CREATE POLICY "users_update_master" ON public.users
FOR UPDATE
USING (
  public.is_master(workspace_id)
  AND workspace_id IN (
    SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Apenas master pode deletar usuários (exceto a si mesmo se for o único master)
CREATE POLICY "users_delete_master" ON public.users
FOR DELETE
USING (
  public.is_master(workspace_id)
  AND auth_user_id != auth.uid()
  AND workspace_id IN (
    SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- 15. Atualizar políticas da tabela workspaces

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "select_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "insert_workspaces_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "update_workspace" ON public.workspaces;
DROP POLICY IF EXISTS "delete_workspace" ON public.workspaces;

-- Nova política: usuários podem ver workspaces onde têm usuário interno
CREATE POLICY "workspaces_select" ON public.workspaces
FOR SELECT
USING (
  id IN (SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Nova política: qualquer autenticado pode criar workspace (primeiro cadastro)
CREATE POLICY "workspaces_insert" ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Nova política: apenas master pode atualizar workspace
CREATE POLICY "workspaces_update" ON public.workspaces
FOR UPDATE
USING (public.is_master(id));

-- Nova política: apenas master pode deletar workspace
CREATE POLICY "workspaces_delete" ON public.workspaces
FOR DELETE
USING (public.is_master(id));

-- 16. Trigger para atualizar updated_at na tabela users
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Função para criar hash do documento
CREATE OR REPLACE FUNCTION public.hash_document(p_document TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(p_document, 'sha256'), 'hex');
$$;

-- 18. Função RPC para registro completo (transacional)
CREATE OR REPLACE FUNCTION public.register_first_user(
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_document_type public.document_type,
  p_document_value TEXT,
  p_trade_name TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_workspace_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_workspace_id UUID;
  v_user_id UUID;
  v_document_hash TEXT;
  v_workspace_name TEXT;
BEGIN
  -- Obter auth user id
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se usuário já tem cadastro interno
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE EXCEPTION 'Usuário já possui cadastro completo';
  END IF;
  
  -- Gerar hash do documento
  v_document_hash := public.hash_document(p_document_value);
  
  -- Verificar se documento já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE document_hash = v_document_hash) THEN
    RAISE EXCEPTION 'Documento já cadastrado no sistema';
  END IF;
  
  -- Determinar nome do workspace
  v_workspace_name := COALESCE(p_workspace_name, p_name);
  
  -- Criar workspace
  INSERT INTO public.workspaces (nome, owner_id, created_by_user_id)
  VALUES (v_workspace_name, v_auth_user_id, NULL)
  RETURNING id INTO v_workspace_id;
  
  -- Criar usuário interno
  INSERT INTO public.users (
    auth_user_id,
    workspace_id,
    name,
    email,
    phone,
    document_type,
    document_hash,
    trade_name,
    birth_date,
    role,
    status
  )
  VALUES (
    v_auth_user_id,
    v_workspace_id,
    p_name,
    p_email,
    p_phone,
    p_document_type,
    v_document_hash,
    p_trade_name,
    p_birth_date,
    'master',
    'active'
  )
  RETURNING id INTO v_user_id;
  
  -- Atualizar workspace com created_by_user_id
  UPDATE public.workspaces 
  SET created_by_user_id = v_user_id
  WHERE id = v_workspace_id;
  
  -- Criar registro em workspace_users para compatibilidade
  INSERT INTO public.workspace_users (user_id, workspace_id, role)
  VALUES (v_auth_user_id, v_workspace_id, 'owner')
  ON CONFLICT DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'workspace_id', v_workspace_id,
    'role', 'master'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 19. Função para verificar se usuário tem cadastro completo
CREATE OR REPLACE FUNCTION public.has_complete_registration()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
  );
$$;