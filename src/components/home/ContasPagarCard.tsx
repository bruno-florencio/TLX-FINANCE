import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Calendar, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankLogo } from "@/components/ui/BankLogo";

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
  const [contas, setContas] = useState<Conta[]>([]);

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

      setContas(contasRes.data || []);

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

  const getStatusBadge = (diasAtraso: number) => {
    if (diasAtraso > 0) {
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
          {diasAtraso}d atraso
        </Badge>
      );
    }
    if (diasAtraso === 0) {
      return (
        <Badge className="bg-pendente/20 text-pendente border-pendente/30 text-xs">
          Vence hoje
        </Badge>
      );
    }
    if (diasAtraso >= -7) {
      return (
        <Badge className="bg-pendente/20 text-pendente border-pendente/30 text-xs">
          {Math.abs(diasAtraso)}d restantes
        </Badge>
      );
    }
    return null;
  };

  const totalAPagar = contasPagar.reduce((sum, c) => sum + Number(c.valor), 0);
  const totalAtrasado = contasPagar
    .filter((c) => c.diasAtraso > 0)
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <Card className="h-molina-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="w-5 h-5 text-saida" />
          <span>Contas a Pagar</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contasPagar.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conta a pagar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
              <div>Descrição</div>
              <div className="w-24 text-center">Vencimento</div>
              <div className="w-28 text-right">Valor</div>
            </div>

            {/* Lista */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {contasPagar.slice(0, 10).map((conta) => (
                <div
                  key={conta.id}
                  className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center p-3 rounded-lg border transition-all ${
                    conta.diasAtraso > 0
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {conta.descricao}
                      </span>
                      {getStatusBadge(conta.diasAtraso)}
                    </div>
                    {conta.conta_nome && (
                      <div className="flex items-center gap-1 mt-1">
                        <BankLogo bankName={conta.banco || conta.conta_nome} size="sm" />
                        <span className="text-xs text-muted-foreground truncate">
                          {conta.conta_nome}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground w-24 justify-center">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(conta.data_vencimento)}</span>
                  </div>
                  <div className="w-28 text-right font-semibold text-saida">
                    {formatCurrency(conta.valor)}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="border-t border-border pt-3 space-y-2">
              {totalAtrasado > 0 && (
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>Total Atrasado</span>
                  </div>
                  <span className="font-bold text-destructive">
                    {formatCurrency(totalAtrasado)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold">TOTAL A PAGAR</span>
                <span className="font-bold text-lg text-saida">
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
