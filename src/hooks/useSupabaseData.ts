import { useState, useEffect } from 'react';
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

export interface Conta {
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

export const useSupabaseData = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as tabelas em paralelo
      const [categoriasRes, contasRes, centrosCustoRes, fornecedoresRes] = await Promise.all([
        supabase.from('categorias').select('*').order('nome'),
        supabase.from('contas').select('*').eq('ativo', true).order('nome'),
        supabase.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome')
      ]);

      if (categoriasRes.error) {
        console.error('Erro ao buscar categorias:', categoriasRes.error);
      } else {
        setCategorias((categoriasRes.data || []) as unknown as Categoria[]);
      }

      if (contasRes.error) {
        console.error('Erro ao buscar contas:', contasRes.error);
      } else {
        setContas((contasRes.data || []) as unknown as Conta[]);
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    categorias,
    contas,
    centrosCusto,
    fornecedores,
    loading,
    refetch: fetchData
  };
};
