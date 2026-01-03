import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InternalUser {
  id: string;
  auth_user_id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone: string | null;
  document_type: 'cpf' | 'cnpj';
  trade_name: string | null;
  birth_date: string | null;
  role: 'master' | 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  created_at: string;
  updated_at: string;
}

/**
 * Hook para obter o usuário interno (tabela users) do usuário autenticado.
 * O usuário interno é o registro na tabela public.users vinculado ao auth.users.
 */
export const useInternalUser = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInternalUser = async () => {
      if (!authUser) {
        setInternalUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .eq('status', 'active')
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Nenhum registro encontrado - usuário não completou cadastro
            setInternalUser(null);
          } else {
            throw fetchError;
          }
        } else {
          setInternalUser(data as InternalUser);
        }
      } catch (err: any) {
        console.error('Erro ao buscar usuário interno:', err);
        setError(err.message);
        setInternalUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchInternalUser();
    }
  }, [authUser, authLoading]);

  /**
   * Verifica se o usuário tem cadastro completo
   */
  const hasCompleteRegistration = !!internalUser;

  /**
   * Verifica se o usuário é master do workspace
   */
  const isMaster = internalUser?.role === 'master';

  /**
   * Verifica se o usuário é admin ou master
   */
  const isAdminOrMaster = internalUser?.role === 'master' || internalUser?.role === 'admin';

  /**
   * Recarrega os dados do usuário interno
   */
  const refetch = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .eq('status', 'active')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setInternalUser(null);
        } else {
          throw fetchError;
        }
      } else {
        setInternalUser(data as InternalUser);
      }
    } catch (err: any) {
      console.error('Erro ao recarregar usuário interno:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    internalUser,
    loading: loading || authLoading,
    error,
    hasCompleteRegistration,
    isMaster,
    isAdminOrMaster,
    workspaceId: internalUser?.workspace_id ?? null,
    refetch
  };
};
