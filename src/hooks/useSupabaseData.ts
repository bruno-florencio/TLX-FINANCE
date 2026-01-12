import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida';
  cor?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContaBancaria {
  id: string;
  nome: string;
  tipo: string;
  banco?: string | null;
  agencia?: string | null;
  numero_conta?: string | null;
  bandeira?: string | null;
  limite?: number;
  saldo_inicial: number;
  saldo_atual?: number;
  cor?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  documento?: string | null;
  tipo_documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  contato?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  workspace_id: string;
  created_at?: string;
  updated_at?: string;
}

interface UseSupabaseDataOptions {
  includeInactive?: boolean;
}

/**
 * Hook para buscar dados do Supabase.
 * NÃO aplica filtros manuais - confia inteiramente no RLS do Supabase.
 * O controle de acesso por workspace é feito automaticamente via RLS.
 * 
 * @param options.includeInactive - Se true, busca todos os registros (para tela de configuração)
 */
export const useSupabaseData = (options: UseSupabaseDataOptions = {}) => {
  const { includeInactive = false } = options;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todas as tabelas em paralelo
      // O RLS cuida automaticamente do filtro por workspace
      // Se includeInactive = true, não filtra por ativo (para configuração)
      const contasQuery = includeInactive 
        ? supabase.from('contas_bancarias').select('*').order('nome')
        : supabase.from('contas_bancarias').select('*').eq('ativo', true).order('nome');
      
      const centrosCustoQuery = includeInactive
        ? supabase.from('centros_custo').select('*').order('nome')
        : supabase.from('centros_custo').select('*').eq('ativo', true).order('nome');
      
      const fornecedoresQuery = includeInactive
        ? supabase.from('fornecedores').select('*').order('nome')
        : supabase.from('fornecedores').select('*').eq('ativo', true).order('nome');
      
      const clientesQuery = includeInactive
        ? supabase.from('clientes').select('*').order('nome')
        : supabase.from('clientes').select('*').eq('ativo', true).order('nome');

      const [categoriasRes, contasRes, centrosCustoRes, fornecedoresRes, clientesRes] = await Promise.all([
        supabase.from('categorias').select('*').order('nome'),
        contasQuery,
        centrosCustoQuery,
        fornecedoresQuery,
        clientesQuery
      ]);

      if (categoriasRes.error) {
        console.error('Erro ao buscar categorias:', categoriasRes.error);
      } else {
        setCategorias((categoriasRes.data || []) as unknown as Categoria[]);
      }

      if (contasRes.error) {
        console.error('Erro ao buscar contas:', contasRes.error);
      } else {
        setContas((contasRes.data || []) as unknown as ContaBancaria[]);
      }

      if (centrosCustoRes.error) {
        console.error('Erro ao buscar centros de custo:', centrosCustoRes.error);
      } else {
        setCentrosCusto((centrosCustoRes.data || []) as unknown as CentroCusto[]);
      }

      if (fornecedoresRes.error) {
        console.error('Erro ao buscar fornecedores:', fornecedoresRes.error);
      } else {
        setFornecedores((fornecedoresRes.data || []) as unknown as Fornecedor[]);
      }

      if (clientesRes.error) {
        console.error('Erro ao buscar clientes:', clientesRes.error);
      } else {
        setClientes((clientesRes.data || []) as unknown as Cliente[]);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    categorias,
    contas,
    centrosCusto,
    fornecedores,
    clientes,
    loading,
    refetch: fetchData
  };
};
