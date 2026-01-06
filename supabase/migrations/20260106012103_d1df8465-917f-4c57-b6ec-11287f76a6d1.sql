-- Fix infinite-recursion RLS policies (users/workspaces)

-- USERS: avoid self-referential subqueries that trigger infinite recursion
DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select
ON public.users
FOR SELECT
TO authenticated
USING (
  is_master_email()
  OR auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_insert
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  is_master_email()
  OR auth_user_id = auth.uid()
);

-- WORKSPACES: avoid referencing public.users in policies; use SECURITY DEFINER helpers
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
CREATE POLICY workspaces_select
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  is_master_email()
  OR owner_id = auth.uid()
  OR created_by_user_id = get_internal_user_id()
  OR id = get_user_workspace_id()
);

DROP POLICY IF EXISTS workspaces_update ON public.workspaces;
CREATE POLICY workspaces_update
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  is_master_email()
  OR owner_id = auth.uid()
  OR created_by_user_id = get_internal_user_id()
  OR id = get_user_workspace_id()
)
WITH CHECK (
  is_master_email()
  OR owner_id = auth.uid()
  OR created_by_user_id = get_internal_user_id()
  OR id = get_user_workspace_id()
);

DROP POLICY IF EXISTS workspaces_delete ON public.workspaces;
CREATE POLICY workspaces_delete
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  is_master_email()
  OR owner_id = auth.uid()
  OR created_by_user_id = get_internal_user_id()
);

DROP POLICY IF EXISTS workspaces_insert ON public.workspaces;
CREATE POLICY workspaces_insert
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  is_master_email()
  OR owner_id = auth.uid()
);
