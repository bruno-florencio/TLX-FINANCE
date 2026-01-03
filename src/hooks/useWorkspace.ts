import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Workspace {
  workspace_id: string;
  role: 'master' | 'admin' | 'user';
}

/**
 * Hook para obter o workspace_id do usuário autenticado automaticamente.
 * O workspace_id é obtido da tabela users (usuários internos) com base no auth.uid().
 * 
 * REGRA: O workspace_id NUNCA deve ser informado manualmente pelo usuário.
 * Todas as operações de INSERT/UPDATE/SELECT/DELETE devem usar este hook.
 */
export const useWorkspace = () => {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!user) {
        setWorkspaceId(null);
        setWorkspaces([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar workspace do usuário interno
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('workspace_id, role')
          .eq('auth_user_id', user.id)
          .eq('status', 'active');

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.length > 0) {
          const workspaceData = data.map(d => ({
            workspace_id: d.workspace_id,
            role: d.role as 'master' | 'admin' | 'user'
          }));
          setWorkspaces(workspaceData);
          setWorkspaceId(workspaceData[0].workspace_id);
        } else {
          // Fallback: tentar buscar da tabela workspace_users (compatibilidade)
          const { data: legacyData, error: legacyError } = await supabase
            .from('workspace_users')
            .select('workspace_id, role')
            .eq('user_id', user.id);

          if (legacyError) {
            throw legacyError;
          }

          if (legacyData && legacyData.length > 0) {
            const workspaceData = legacyData.map(d => ({
              workspace_id: d.workspace_id,
              role: (d.role === 'owner' ? 'master' : d.role || 'user') as 'master' | 'admin' | 'user'
            }));
            setWorkspaces(workspaceData);
            setWorkspaceId(workspaceData[0].workspace_id);
          } else {
            setWorkspaceId(null);
            setWorkspaces([]);
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar workspace:', err);
        setError(err.message);
        setWorkspaceId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [user]);

  /**
   * Seleciona um workspace específico (para uso futuro com seletor)
   */
  const selectWorkspace = (id: string) => {
    const exists = workspaces.find(w => w.workspace_id === id);
    if (exists) {
      setWorkspaceId(id);
    }
  };

  /**
   * Verifica se o usuário é master do workspace atual
   */
  const isMaster = workspaces.find(w => w.workspace_id === workspaceId)?.role === 'master';

  /**
   * Verifica se o usuário é admin ou master do workspace atual
   */
  const isAdminOrMaster = ['master', 'admin'].includes(
    workspaces.find(w => w.workspace_id === workspaceId)?.role || ''
  );

  return {
    workspaceId,
    workspaces,
    loading,
    error,
    selectWorkspace,
    hasWorkspace: !!workspaceId,
    isMaster,
    isAdminOrMaster
  };
};
