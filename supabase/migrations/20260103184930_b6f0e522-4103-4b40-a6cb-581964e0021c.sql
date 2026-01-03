-- Corrigir search_path nas funções existentes

-- 1. fn_atualizar_saldo_conta
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_conta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status IN ('pago', 'recebido') AND OLD.status NOT IN ('pago', 'recebido') THEN
    IF NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias
      SET saldo = saldo + NEW.valor
      WHERE id = NEW.conta_id;
    ELSIF NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias
      SET saldo = saldo - NEW.valor
      WHERE id = NEW.conta_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. fn_baixa_pagamento
CREATE OR REPLACE FUNCTION public.fn_baixa_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  total_pago NUMERIC;
  valor_lancamento NUMERIC;
BEGIN
  SELECT SUM(valor_pago)
  INTO total_pago
  FROM pagamentos
  WHERE lancamento_id = NEW.lancamento_id;

  SELECT valor
  INTO valor_lancamento
  FROM lancamentos
  WHERE id = NEW.lancamento_id;

  IF total_pago >= valor_lancamento THEN
    UPDATE lancamentos
    SET status = 'pago'
    WHERE id = NEW.lancamento_id;
  ELSE
    UPDATE lancamentos
    SET status = 'parcial'
    WHERE id = NEW.lancamento_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. fn_baixa_recebimento
CREATE OR REPLACE FUNCTION public.fn_baixa_recebimento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  total_recebido NUMERIC;
  valor_lancamento NUMERIC;
BEGIN
  SELECT SUM(valor_recebido)
  INTO total_recebido
  FROM recebimentos
  WHERE lancamento_id = NEW.lancamento_id;

  SELECT valor
  INTO valor_lancamento
  FROM lancamentos
  WHERE id = NEW.lancamento_id;

  IF total_recebido >= valor_lancamento THEN
    UPDATE lancamentos
    SET status = 'recebido'
    WHERE id = NEW.lancamento_id;
  ELSE
    UPDATE lancamentos
    SET status = 'parcial'
    WHERE id = NEW.lancamento_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. fn_transferencia_contas
CREATE OR REPLACE FUNCTION public.fn_transferencia_contas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE contas_bancarias
  SET saldo = saldo - NEW.valor
  WHERE id = NEW.conta_origem_id;

  UPDATE contas_bancarias
  SET saldo = saldo + NEW.valor
  WHERE id = NEW.conta_destino_id;

  RETURN NEW;
END;
$function$;

-- 5. fn_log_auditoria
CREATE OR REPLACE FUNCTION public.fn_log_auditoria()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO logs_auditoria (
    tabela,
    operacao,
    workspace_id,
    registro_id,
    user_id,
    timestamp
  )
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    NEW.workspace_id,
    NEW.id,
    auth.uid(),
    now()
  );

  RETURN NEW;
END;
$function$;

-- 6. fn_bloquear_saldo_negativo
CREATE OR REPLACE FUNCTION public.fn_bloquear_saldo_negativo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  saldo_atual NUMERIC;
BEGIN
  SELECT saldo INTO saldo_atual
  FROM contas_bancarias
  WHERE id = NEW.conta_id;

  IF NEW.tipo = 'saida' AND saldo_atual < NEW.valor THEN
    RAISE EXCEPTION 'Saldo insuficiente para esta operação.';
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. fn_atualizar_atraso
CREATE OR REPLACE FUNCTION public.fn_atualizar_atraso()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE lancamentos
  SET status = CASE
    WHEN tipo = 'saida' THEN 'atrasado_pagar'
    WHEN tipo = 'entrada' THEN 'atrasado_receber'
  END
  WHERE
    data_vencimento < CURRENT_DATE
    AND status IN ('a_pagar', 'a_receber');
END;
$function$;

-- 8. fn_conciliar_extrato
CREATE OR REPLACE FUNCTION public.fn_conciliar_extrato()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  lancamento_id UUID;
BEGIN
  SELECT id
  INTO lancamento_id
  FROM lancamentos
  WHERE
    conta_id = NEW.conta_id
    AND valor = NEW.valor
    AND ABS(data - NEW.data_movimento) <= 3
    AND conciliado IS FALSE
  LIMIT 1;

  IF lancamento_id IS NOT NULL THEN
    UPDATE lancamentos
    SET conciliado = TRUE
    WHERE id = lancamento_id;

    UPDATE extratos_bancarios
    SET conciliado = TRUE
    WHERE id = NEW.id;
  ELSE
    UPDATE extratos_bancarios
    SET conciliado = FALSE
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 9. marcar_atrasado
CREATE OR REPLACE FUNCTION public.marcar_atrasado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'pendente' AND NEW.data < current_date THEN
    NEW.status := 'atrasado';
  END IF;
  RETURN NEW;
END;
$function$;

-- 10. hash_document usando encode/sha256 do extensions schema
CREATE OR REPLACE FUNCTION public.hash_document(p_document TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN encode(extensions.digest(p_document::bytea, 'sha256'), 'hex');
END;
$function$;

-- 11. Atualizar register_first_user para usar a nova função hash
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
SET search_path = public, extensions
AS $$
DECLARE
  v_auth_user_id UUID;
  v_workspace_id UUID;
  v_user_id UUID;
  v_document_hash TEXT;
  v_workspace_name TEXT;
BEGIN
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE EXCEPTION 'Usuário já possui cadastro completo';
  END IF;
  
  -- Hash do documento usando MD5 nativo do PostgreSQL
  v_document_hash := md5(p_document_value);
  
  IF EXISTS (SELECT 1 FROM public.users WHERE document_hash = v_document_hash) THEN
    RAISE EXCEPTION 'Documento já cadastrado no sistema';
  END IF;
  
  v_workspace_name := COALESCE(p_workspace_name, p_name);
  
  INSERT INTO public.workspaces (nome, owner_id, created_by_user_id)
  VALUES (v_workspace_name, v_auth_user_id, NULL)
  RETURNING id INTO v_workspace_id;
  
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
  
  UPDATE public.workspaces 
  SET created_by_user_id = v_user_id
  WHERE id = v_workspace_id;
  
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

-- 12. Também atualizar hash_document para usar md5
CREATE OR REPLACE FUNCTION public.hash_document(p_document TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(p_document);
$$;

-- 13. Adicionar política RLS para tabela conciliacoes
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conciliacoes_all" ON public.conciliacoes
FOR ALL
USING (
  lancamento_id IN (
    SELECT id FROM public.lancamentos 
    WHERE workspace_id IN (
      SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  lancamento_id IN (
    SELECT id FROM public.lancamentos 
    WHERE workspace_id IN (
      SELECT workspace_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
);