-- Add missing columns to workspace_invites for invite system
ALTER TABLE public.workspace_invites 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);

-- Create function to generate unique invite token
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS workspace_invites_select ON public.workspace_invites;
DROP POLICY IF EXISTS workspace_invites_insert ON public.workspace_invites;
DROP POLICY IF EXISTS workspace_invites_update ON public.workspace_invites;
DROP POLICY IF EXISTS workspace_invites_delete ON public.workspace_invites;

-- RLS: Master of workspace can manage invites
CREATE POLICY workspace_invites_select
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (
  is_master_email()
  OR workspace_id = get_user_workspace_id()
);

CREATE POLICY workspace_invites_insert
ON public.workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (
  is_master_email()
  OR (
    workspace_id = get_user_workspace_id()
    AND is_master(workspace_id)
  )
);

CREATE POLICY workspace_invites_update
ON public.workspace_invites
FOR UPDATE
TO authenticated
USING (
  is_master_email()
  OR (
    workspace_id = get_user_workspace_id()
    AND is_master(workspace_id)
  )
);

CREATE POLICY workspace_invites_delete
ON public.workspace_invites
FOR DELETE
TO authenticated
USING (
  is_master_email()
  OR (
    workspace_id = get_user_workspace_id()
    AND is_master(workspace_id)
  )
);

-- Public policy for accepting invites (anonymous can read by token)
CREATE POLICY workspace_invites_public_select
ON public.workspace_invites
FOR SELECT
TO anon
USING (token IS NOT NULL AND status = 'pending' AND expires_at > now());

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_invite(p_token TEXT, p_auth_user_id UUID, p_name TEXT, p_email TEXT, p_phone TEXT, p_document_type document_type, p_document_value TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_document_hash TEXT;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite
  FROM public.workspace_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();
  
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  
  -- Check if user already exists in this workspace
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = p_auth_user_id AND workspace_id = v_invite.workspace_id) THEN
    RAISE EXCEPTION 'Usuário já pertence a este workspace';
  END IF;
  
  -- Hash the document
  v_document_hash := md5(p_document_value);
  
  -- Create internal user
  INSERT INTO public.users (
    auth_user_id,
    workspace_id,
    name,
    email,
    phone,
    document_type,
    document_hash,
    role,
    status
  )
  VALUES (
    p_auth_user_id,
    v_invite.workspace_id,
    p_name,
    p_email,
    p_phone,
    p_document_type,
    v_document_hash,
    v_invite.role::app_role,
    'active'
  )
  RETURNING id INTO v_user_id;
  
  -- Add to workspace_users
  INSERT INTO public.workspace_users (user_id, workspace_id, role)
  VALUES (p_auth_user_id, v_invite.workspace_id, v_invite.role)
  ON CONFLICT DO NOTHING;
  
  -- Mark invite as accepted
  UPDATE public.workspace_invites
  SET status = 'accepted', accepted = true
  WHERE id = v_invite.id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'workspace_id', v_invite.workspace_id,
    'role', v_invite.role
  );
END;
$$;

-- Function to get invite by token (public)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_workspace_name TEXT;
BEGIN
  SELECT wi.*, w.nome as workspace_name
  INTO v_invite
  FROM public.workspace_invites wi
  JOIN public.workspaces w ON w.id = wi.workspace_id
  WHERE wi.token = p_token
    AND wi.status = 'pending'
    AND wi.expires_at > now();
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Convite inválido ou expirado');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', v_invite.email,
    'role', v_invite.role,
    'workspace_name', v_invite.workspace_name,
    'workspace_id', v_invite.workspace_id
  );
END;
$$;