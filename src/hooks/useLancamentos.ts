import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';

export interface Lancamento {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  categoria_id?: string | null;
  conta_id?: string | null;
  centro_custo_id?: string | null;
  fornecedor_id?: string | null;
  numero_documento?: string | null;
  observacoes?: string | null;
  recorrente?: boolean;
  parcela_atual?: number | null;
  total_parcelas?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface NewLancamento {
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria_id?: string | null;
  conta_id?: string | null;
  centro_custo_id?: string | null;
  fornecedor_id?: string | null;
  numero_documento?: string | null;
  observacoes?: string | null;
  recorrente?: boolean;
  parcela_atual?: number | null;
  total_parcelas?: number | null;
}

/**
 * Hook para gerenciar lançamentos (entradas e saídas).
 * O workspace_id é obtido automaticamente do hook useWorkspace.
 * NÃO aplica filtros manuais - confia inteiramente no RLS do Supabase.
 */
export const useLancamentos = (tipo?: 'entrada' | 'saida') => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { workspaceId, hasWorkspace } = useWorkspace();

  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      // O RLS cuida automaticamente do filtro por workspace
      let query = supabase.from('lancamentos').select('*');
      
      if (tipo) {
        query = query.eq('tipo', tipo);
      }
      
      const { data, error } = await query.order('data_vencimento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar lançamentos.",
          variant: "destructive"
        });
        return;
      }

      setLancamentos((data || []) as unknown as Lancamento[]);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLancamento = async (newLancamento: NewLancamento) => {
    if (!hasWorkspace) {
      toast({
        title: "Erro",
        description: "Usuário não pertence a nenhum workspace.",
        variant: "destructive"
      });
      return null;
    }

    try {
      // workspace_id é obtido automaticamente do hook useWorkspace
      const { data, error } = await supabase
        .from('lancamentos')
        .insert([{ ...newLancamento, workspace_id: workspaceId } as any])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lançamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar lançamento.",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Sucesso",
        description: `${newLancamento.tipo === 'entrada' ? 'Entrada' : 'Saída'} criada com sucesso.`,
      });

      // Recarregar lista
      await fetchLancamentos();
      return data;
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar lançamento.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateLancamento = async (id: string, updates: Partial<Lancamento>) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update(updates as any)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar lançamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar lançamento.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Lançamento atualizado com sucesso.",
      });

      // Recarregar lista
      await fetchLancamentos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar lançamento.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteLancamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir lançamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir lançamento.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso.",
        variant: "destructive"
      });

      // Recarregar lista
      await fetchLancamentos();
      return true;
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lançamento.",
        variant: "destructive"
      });
      return false;
    }
  };

  const markAsPaid = async (id: string) => {
    return updateLancamento(id, { 
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    fetchLancamentos();
  }, [tipo]);

  return {
    lancamentos,
    loading,
    createLancamento,
    updateLancamento,
    deleteLancamento,
    markAsPaid,
    refetch: fetchLancamentos
  };
};
