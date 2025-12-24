import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  conta_id?: string | null;
  categoria_id?: string | null;
}

interface Conta {
  id: string;
  nome: string;
  banco?: string | null;
}

interface ContaPagar extends Lancamento {
  conta_nome?: string;
  banco?: string | null;
  diasAtraso: number;
}

export const ContasPagarCard = () => {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContasPagar();
  }, []);

  const fetchContasPagar = async () => {
    try {
      setLoading(true);

      const [lancamentosRes, contasRes] = await Promise.all([
        supabase
          .from("lancamentos")
          .select("*")
          .eq("tipo", "saida")
          .eq("status", "pendente")
          .order("data_vencimento", { ascending: true }),
        supabase.from("contas").select("id, nome, banco").eq("ativo", true),
      ]);

      if (lancamentosRes.error) throw lancamentosRes.error;
      if (contasRes.error) throw contasRes.error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const contasPagarFormatadas: ContaPagar[] = (
        lancamentosRes.data || []
      ).map((l) => {
        const conta = (contasRes.data || []).find((c) => c.id === l.conta_id);
        const dataVenc = new Date(l.data_vencimento);
        const diffTime = hoje.getTime() - dataVenc.getTime();
        const diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...l,
          conta_nome: conta?.nome,
          banco: conta?.banco,
          diasAtraso,
        };
      });

      setContasPagar(contasPagarFormatadas);
    } catch (error) {
      console.error("Erro ao buscar contas a pagar:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusLabel = (diasAtraso: number) => {
    if (diasAtraso > 0) {
      return <span className="text-xs text-saida">{diasAtraso}d atraso</span>;
    }
    if (diasAtraso === 0) {
      return <span className="text-xs text-pendente">Hoje</span>;
    }
    if (diasAtraso >= -7) {
      return <span className="text-xs text-muted-foreground">{Math.abs(diasAtraso)}d</span>;
    }
    return null;
  };

  const totalAPagar = contasPagar.reduce((sum, c) => sum + Number(c.valor), 0);
  const totalAtrasado = contasPagar
    .filter((c) => c.diasAtraso > 0)
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <Card className="clean-card h-full">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-saida" />
          <CardTitle className="text-base font-semibold text-foreground">
            Contas a Pagar
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : contasPagar.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma conta a pagar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_90px] gap-2 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              <div>Descrição</div>
              <div className="text-center">Venc.</div>
              <div className="text-right">Valor</div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-border/40 max-h-[280px] overflow-y-auto">
              {contasPagar.slice(0, 10).map((conta) => (
                <div
                  key={conta.id}
                  className="grid grid-cols-[1fr_80px_90px] gap-2 items-center py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate text-foreground">
                        {conta.descricao}
                      </span>
                      {getStatusLabel(conta.diasAtraso)}
                    </div>
                    {conta.conta_nome && (
                      <span className="text-xs text-muted-foreground">
                        {conta.conta_nome}
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs text-muted-foreground tabular-nums">
                    {formatDate(conta.data_vencimento)}
                  </div>
                  <div className="text-right text-sm font-semibold text-saida tabular-nums">
                    {formatCurrency(conta.valor)}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="border-t border-border/50 pt-3 mt-2 space-y-1.5">
              {totalAtrasado > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-saida">
                    <AlertCircle className="w-3 h-3" />
                    <span>Atrasado</span>
                  </div>
                  <span className="text-sm font-semibold text-saida tabular-nums">
                    {formatCurrency(totalAtrasado)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-saida tabular-nums">
                  {formatCurrency(totalAPagar)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
