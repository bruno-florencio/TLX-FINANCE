-- =============================================
-- MASTER EMAIL BYPASS - brunofdalmeida1@gmail.com
-- =============================================

-- 1. Recriar função is_master_email() com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_master_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'brunofdalmeida1@gmail.com';
$$;

-- 2. Dropar todas as políticas antigas e recriar com bypass master

-- WORKSPACES
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;

CREATE POLICY "workspaces_select" ON public.workspaces FOR SELECT
USING (is_master_email() OR id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "workspaces_insert" ON public.workspaces FOR INSERT
WITH CHECK (is_master_email() OR auth.uid() IS NOT NULL);

CREATE POLICY "workspaces_update" ON public.workspaces FOR UPDATE
USING (is_master_email() OR is_master(id));

CREATE POLICY "workspaces_delete" ON public.workspaces FOR DELETE
USING (is_master_email() OR is_master(id));

-- USERS
DROP POLICY IF EXISTS "users_select_same_workspace" ON public.users;
DROP POLICY IF EXISTS "users_insert_master_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_master" ON public.users;
DROP POLICY IF EXISTS "users_delete_master" ON public.users;

CREATE POLICY "users_select" ON public.users FOR SELECT
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "users_insert" ON public.users FOR INSERT
WITH CHECK (is_master_email() OR is_master(workspace_id) OR NOT EXISTS (SELECT 1 FROM users WHERE workspace_id = users.workspace_id));

CREATE POLICY "users_update" ON public.users FOR UPDATE
USING (is_master_email() OR auth_user_id = auth.uid() OR is_master(workspace_id));

CREATE POLICY "users_delete" ON public.users FOR DELETE
USING (is_master_email() OR (is_master(workspace_id) AND auth_user_id <> auth.uid()));

-- WORKSPACE_USERS
DROP POLICY IF EXISTS "workspace_users_select_own" ON public.workspace_users;
DROP POLICY IF EXISTS "workspace_users_insert_own" ON public.workspace_users;
DROP POLICY IF EXISTS "workspace_users_update_own" ON public.workspace_users;
DROP POLICY IF EXISTS "workspace_users_delete_own" ON public.workspace_users;

CREATE POLICY "workspace_users_select" ON public.workspace_users FOR SELECT
USING (is_master_email() OR user_id = auth.uid());

CREATE POLICY "workspace_users_insert" ON public.workspace_users FOR INSERT
WITH CHECK (is_master_email() OR user_id = auth.uid());

CREATE POLICY "workspace_users_update" ON public.workspace_users FOR UPDATE
USING (is_master_email() OR user_id = auth.uid());

CREATE POLICY "workspace_users_delete" ON public.workspace_users FOR DELETE
USING (is_master_email() OR user_id = auth.uid());

-- CONTAS_BANCARIAS
DROP POLICY IF EXISTS "contas - acesso por workspace" ON public.contas_bancarias;
DROP POLICY IF EXISTS "contas_bancarias_all" ON public.contas_bancarias;

CREATE POLICY "contas_bancarias_access" ON public.contas_bancarias FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- LANCAMENTOS
DROP POLICY IF EXISTS "lancamentos - acesso por workspace" ON public.lancamentos;
DROP POLICY IF EXISTS "lancamentos_all" ON public.lancamentos;

CREATE POLICY "lancamentos_access" ON public.lancamentos FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CATEGORIAS
DROP POLICY IF EXISTS "Categorias - acesso por workspace" ON public.categorias;

CREATE POLICY "categorias_access" ON public.categorias FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CENTROS_CUSTO
DROP POLICY IF EXISTS "centros_custo - acesso por workspace" ON public.centros_custo;
DROP POLICY IF EXISTS "centros_custo_all" ON public.centros_custo;

CREATE POLICY "centros_custo_access" ON public.centros_custo FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- FORNECEDORES
DROP POLICY IF EXISTS "fornecedores - acesso por workspace" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_all" ON public.fornecedores;

CREATE POLICY "fornecedores_access" ON public.fornecedores FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CLIENTES
DROP POLICY IF EXISTS "clientes_all" ON public.clientes;
DROP POLICY IF EXISTS "select_clientes" ON public.clientes;
DROP POLICY IF EXISTS "insert_clientes" ON public.clientes;
DROP POLICY IF EXISTS "update_clientes" ON public.clientes;
DROP POLICY IF EXISTS "delete_clientes" ON public.clientes;

CREATE POLICY "clientes_access" ON public.clientes FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- TRANSFERENCIAS
DROP POLICY IF EXISTS "transferencias - acesso por workspace" ON public.transferencias;
DROP POLICY IF EXISTS "transferencias_all" ON public.transferencias;

CREATE POLICY "transferencias_access" ON public.transferencias FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- PAGAMENTOS
DROP POLICY IF EXISTS "pagamentos_all" ON public.pagamentos;

CREATE POLICY "pagamentos_access" ON public.pagamentos FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- RECEBIMENTOS
DROP POLICY IF EXISTS "recebimentos_all" ON public.recebimentos;

CREATE POLICY "recebimentos_access" ON public.recebimentos FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- EXTRATOS_BANCARIOS
DROP POLICY IF EXISTS "extratos_all" ON public.extratos_bancarios;

CREATE POLICY "extratos_bancarios_access" ON public.extratos_bancarios FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CONFIGURACOES
DROP POLICY IF EXISTS "configuracoes_all" ON public.configuracoes;

CREATE POLICY "configuracoes_access" ON public.configuracoes FOR ALL
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()))
WITH CHECK (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CONCILIACOES
DROP POLICY IF EXISTS "conciliacoes_all" ON public.conciliacoes;

CREATE POLICY "conciliacoes_access" ON public.conciliacoes FOR ALL
USING (is_master_email() OR lancamento_id IN (
  SELECT id FROM lancamentos WHERE workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  )
))
WITH CHECK (is_master_email() OR lancamento_id IN (
  SELECT id FROM lancamentos WHERE workspace_id IN (
    SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()
  )
));

-- LOGS_AUDITORIA
DROP POLICY IF EXISTS "logs_select" ON public.logs_auditoria;

CREATE POLICY "logs_auditoria_select" ON public.logs_auditoria FOR SELECT
USING (is_master_email() OR workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- WORKSPACE_INVITES
DROP POLICY IF EXISTS "select_workspace_invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "insert_workspace_invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "delete_workspace_invites" ON public.workspace_invites;

CREATE POLICY "workspace_invites_select" ON public.workspace_invites FOR SELECT
USING (is_master_email() OR invited_by = auth.uid() OR workspace_id IN (
  SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
));

CREATE POLICY "workspace_invites_insert" ON public.workspace_invites FOR INSERT
WITH CHECK (is_master_email() OR (invited_by = auth.uid() AND workspace_id IN (
  SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
)));

CREATE POLICY "workspace_invites_update" ON public.workspace_invites FOR UPDATE
USING (is_master_email());

CREATE POLICY "workspace_invites_delete" ON public.workspace_invites FOR DELETE
USING (is_master_email() OR invited_by = auth.uid() OR workspace_id IN (
  SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
));

-- 3. Criar tabela de feature flags para master email
CREATE TABLE IF NOT EXISTS public.master_features (
  email TEXT PRIMARY KEY,
  max_workspaces INTEGER DEFAULT NULL,
  max_users INTEGER DEFAULT NULL,
  all_features BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.master_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_features_access" ON public.master_features FOR ALL
USING (is_master_email())
WITH CHECK (is_master_email());

-- Inserir configuração para o email master
INSERT INTO public.master_features (email, max_workspaces, max_users, all_features)
VALUES ('brunofdalmeida1@gmail.com', NULL, NULL, TRUE)
ON CONFLICT (email) DO UPDATE SET
  max_workspaces = NULL,
  max_users = NULL,
  all_features = TRUE;