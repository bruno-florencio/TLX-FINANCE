import { useState, useEffect, useCallback } from 'react';
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
 * 
 * ONBOARDING: Se o usuário não tiver workspace, um é criado automaticamente.
 */
export const useWorkspace = () => {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  /**
   * Cria um novo workspace e vincula o usuário como owner
   */
  const createDefaultWorkspace = useCallback(async (userId: string): Promise<string | null> => {
    try {
      setIsCreatingWorkspace(true);
      
      // 1. Criar o workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          nome: 'Meu Workspace',
          owner_id: userId
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Erro ao criar workspace:', createError);
        throw new Error('Não foi possível criar o workspace: ' + createError.message);
      }

      if (!newWorkspace) {
        throw new Error('Workspace criado mas sem ID retornado');
      }

      // 2. Vincular o usuário ao workspace como owner
      const { error: linkError } = await supabase
        .from('workspace_users')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: userId,
          role: 'owner'
        });

      if (linkError) {
        console.error('Erro ao vincular usuário ao workspace:', linkError);
        // Tentar deletar o workspace criado para evitar orphans
        await supabase.from('workspaces').delete().eq('id', newWorkspace.id);
        throw new Error('Não foi possível vincular usuário ao workspace: ' + linkError.message);
      }

      console.log('Workspace criado com sucesso:', newWorkspace.id);
      return newWorkspace.id;
    } catch (err: any) {
      console.error('Erro no onboarding:', err);
      throw err;
    } finally {
      setIsCreatingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    const fetchOrCreateWorkspace = async () => {
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
          // Usuário já tem workspace(s)
          setWorkspaces(data);
          setWorkspaceId(data[0].workspace_id);
        } else {
          // ONBOARDING: Usuário não tem workspace - criar automaticamente
          console.log('Usuário sem workspace, iniciando onboarding...');
          
          const newWorkspaceId = await createDefaultWorkspace(user.id);
          
          if (newWorkspaceId) {
            setWorkspaceId(newWorkspaceId);
            setWorkspaces([{ workspace_id: newWorkspaceId, role: 'owner' }]);
          } else {
            throw new Error('Falha ao criar workspace padrão');
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar/criar workspace:', err);
        setError(err.message || 'Erro ao configurar workspace');
        setWorkspaceId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateWorkspace();
  }, [user, createDefaultWorkspace]);

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
    hasWorkspace: !!workspaceId,
    isCreatingWorkspace
  };
};
