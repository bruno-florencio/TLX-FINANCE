import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Workspace {
  id: string;
  nome: string;
  owner_id: string | null;
  created_by_user_id: string | null;
  created_at: string | null;
}

interface WorkspaceWithRole extends Workspace {
  role: 'master' | 'admin' | 'user';
}

/**
 * Hook para obter o workspace do usuário autenticado.
 * Obtém diretamente da tabela users.workspace_id
 */
export const useWorkspace = () => {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!user) {
      setWorkspaceId(null);
      setWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do usuário interno incluindo workspace_id e role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('workspace_id, role')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData?.workspace_id) {
        // Usuário não tem workspace - isso é válido para novos usuários
        setWorkspaceId(null);
        setWorkspace(null);
        setLoading(false);
        return;
      }

      setWorkspaceId(userData.workspace_id);

      // Buscar dados completos do workspace
      const { data: workspaceData, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', userData.workspace_id)
        .maybeSingle();

      if (wsError) {
        throw wsError;
      }

      if (workspaceData) {
        setWorkspace({
          ...workspaceData,
          role: (userData.role || 'user') as 'master' | 'admin' | 'user'
        });
      } else {
        // Workspace não encontrado mas usuário tem workspace_id
        console.warn('Workspace não encontrado para id:', userData.workspace_id);
        setWorkspace(null);
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar workspace:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setWorkspaceId(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  /**
   * Verifica se o usuário é master do workspace atual
   */
  const isMaster = workspace?.role === 'master';

  /**
   * Verifica se o usuário é admin ou master do workspace atual
   */
  const isAdminOrMaster = workspace?.role === 'master' || workspace?.role === 'admin';

  return {
    workspaceId,
    workspace,
    loading,
    error,
    hasWorkspace: !!workspaceId,
    isMaster,
    isAdminOrMaster,
    refetch: fetchWorkspace
  };
};
