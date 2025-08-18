import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida';
  descricao?: string;
  ativo: boolean;
}

export interface Conta {
  id: string;
  nome: string;
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'cartao';
  banco?: string;
  saldo_inicial: number;
  ativo: boolean;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface Fornecedor {
  id: string;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
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
        supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
        supabase.from('contas').select('*').eq('ativo', true).order('nome'),
        supabase.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabase.from('fornecedores').select('*').eq('ativo', true).order('nome')
      ]);

      if (categoriasRes.error) {
        console.error('Erro ao buscar categorias:', categoriasRes.error);
      } else {
        setCategorias((categoriasRes.data || []) as Categoria[]);
      }

      if (contasRes.error) {
        console.error('Erro ao buscar contas:', contasRes.error);
      } else {
        setContas((contasRes.data || []) as Conta[]);
      }

      if (centrosCustoRes.error) {
        console.error('Erro ao buscar centros de custo:', centrosCustoRes.error);
      } else {
        setCentrosCusto(centrosCustoRes.data || []);
      }

      if (fornecedoresRes.error) {
        console.error('Erro ao buscar fornecedores:', fornecedoresRes.error);
      } else {
        setFornecedores(fornecedoresRes.data || []);
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