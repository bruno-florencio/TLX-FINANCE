import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Workspace {
  workspace_id: string;
  role: string | null;
}

/**
 * Hook para obter o workspace_id do usuário autenticado automaticamente.
 * O workspace_id é obtido da tabela workspace_users com base no auth.uid().
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

        // Buscar todos os workspaces do usuário
        const { data, error: fetchError } = await supabase
          .from('workspace_users')
          .select('workspace_id, role')
          .eq('user_id', user.id);

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.length > 0) {
          setWorkspaces(data);
          // Usar o primeiro workspace até implementar seletor
          setWorkspaceId(data[0].workspace_id);
        } else {
          setWorkspaceId(null);
          setWorkspaces([]);
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

  return {
    workspaceId,
    workspaces,
    loading,
    error,
    selectWorkspace,
    hasWorkspace: !!workspaceId
  };
};
