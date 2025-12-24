import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { BankLogo } from "@/components/ui/BankLogo";
import { supabase } from "@/integrations/supabase/client";

interface Conta {
  id: string;
  nome: string;
  banco?: string | null;
  tipo: string;
  saldo_atual: number;
  ativo: boolean;
}

interface ContaComSaldos extends Conta {
  saldoConfirmado: number;
  saldoProjetado: number;
  visible: boolean;
}

export const SaldosCaixaCard = () => {
  const [contas, setContas] = useState<ContaComSaldos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      setLoading(true);
      
      // Buscar contas (excluindo cartões de crédito)
      const { data: contasData, error: contasError } = await supabase
        .from("contas")
        .select("*")
        .eq("ativo", true)
        .neq("tipo", "cartao_credito")
        .order("nome");

      if (contasError) throw contasError;

      // Buscar lançamentos para calcular saldos
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from("lancamentos")
        .select("*")
        .order("data_vencimento");

      if (lancamentosError) throw lancamentosError;

      // Calcular saldos para cada conta
      const contasComSaldos: ContaComSaldos[] = (contasData || []).map((conta) => {
        const lancamentosConta = (lancamentos || []).filter(
          (l) => l.conta_id === conta.id
        );

        // Saldo confirmado = saldo inicial + entradas pagas - saídas pagas
        const entradasPagas = lancamentosConta
          .filter((l) => l.tipo === "entrada" && l.status === "pago")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saidasPagas = lancamentosConta
          .filter((l) => l.tipo === "saida" && l.status === "pago")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saldoConfirmado = Number(conta.saldo_inicial) + entradasPagas - saidasPagas;

        // Saldo projetado = saldo confirmado + entradas pendentes - saídas pendentes
        const entradasPendentes = lancamentosConta
          .filter((l) => l.tipo === "entrada" && l.status === "pendente")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saidasPendentes = lancamentosConta
          .filter((l) => l.tipo === "saida" && l.status === "pendente")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saldoProjetado = saldoConfirmado + entradasPendentes - saidasPendentes;

        return {
          ...conta,
          saldoConfirmado,
          saldoProjetado,
          visible: true,
        };
      });

      setContas(contasComSaldos);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleContaVisibility = (id: string) => {
    setContas((prev) =>
      prev.map((conta) =>
        conta.id === id ? { ...conta, visible: !conta.visible } : conta
      )
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const contasVisiveis = contas.filter((c) => c.visible);
  
  const totalConfirmado = contasVisiveis.reduce(
    (sum, c) => sum + c.saldoConfirmado,
    0
  );
  
  const totalProjetado = contasVisiveis.reduce(
    (sum, c) => sum + c.saldoProjetado,
    0
  );

  const getValueColor = (value: number) => {
    if (value > 0) return "text-entrada";
    if (value < 0) return "text-saida";
    return "text-foreground";
  };

  return (
    <Card className="h-molina-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-secondary" />
            <span>Saldos de Caixa</span>
          </CardTitle>
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {showValues ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contas.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="w-5"></div>
              <div>Conta</div>
              <div className="text-right">Confirmado</div>
              <div className="text-right">Projetado</div>
            </div>

            {/* Lista de contas */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className={`grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center p-2 rounded-lg transition-all ${
                    conta.visible
                      ? "bg-muted/30 border border-border"
                      : "bg-muted/10 opacity-50"
                  }`}
                >
                  <Checkbox
                    checked={conta.visible}
                    onCheckedChange={() => toggleContaVisibility(conta.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <BankLogo bankName={conta.banco || conta.nome} size="sm" />
                    <span className="text-sm font-medium truncate">
                      {conta.nome}
                    </span>
                  </div>
                  <div
                    className={`text-right text-sm font-semibold ${getValueColor(
                      conta.saldoConfirmado
                    )}`}
                  >
                    {showValues
                      ? formatCurrency(conta.saldoConfirmado)
                      : "••••••"}
                  </div>
                  <div
                    className={`text-right text-sm ${getValueColor(
                      conta.saldoProjetado
                    )}`}
                  >
                    {showValues
                      ? formatCurrency(conta.saldoProjetado)
                      : "••••••"}
                  </div>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="border-t border-border pt-3 mt-3">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center px-2">
                <div className="w-5"></div>
                <div className="text-sm font-bold">TOTAL</div>
                <div
                  className={`text-right font-bold ${getValueColor(
                    totalConfirmado
                  )}`}
                >
                  {showValues ? formatCurrency(totalConfirmado) : "••••••"}
                </div>
                <div
                  className={`text-right font-bold ${getValueColor(
                    totalProjetado
                  )}`}
                >
                  {showValues ? formatCurrency(totalProjetado) : "••••••"}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
