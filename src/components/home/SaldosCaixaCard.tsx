import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Eye, EyeOff } from "lucide-react";
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
      
      const { data: contasData, error: contasError } = await supabase
        .from("contas")
        .select("*")
        .eq("ativo", true)
        .neq("tipo", "cartao_credito")
        .order("nome");

      if (contasError) throw contasError;

      const { data: lancamentos, error: lancamentosError } = await supabase
        .from("lancamentos")
        .select("*")
        .order("data_vencimento");

      if (lancamentosError) throw lancamentosError;

      const contasComSaldos: ContaComSaldos[] = (contasData || []).map((conta) => {
        const lancamentosConta = (lancamentos || []).filter(
          (l) => l.conta_id === conta.id
        );

        const entradasPagas = lancamentosConta
          .filter((l) => l.tipo === "entrada" && l.status === "pago")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saidasPagas = lancamentosConta
          .filter((l) => l.tipo === "saida" && l.status === "pago")
          .reduce((sum, l) => sum + Number(l.valor), 0);

        const saldoConfirmado = Number(conta.saldo_inicial) + entradasPagas - saidasPagas;

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
    <Card className="clean-card">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold text-foreground">
              Saldos de Caixa
            </CardTitle>
          </div>
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            {showValues ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : contas.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-3 px-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              <div className="w-5"></div>
              <div>Conta</div>
              <div className="text-right">Confirmado</div>
              <div className="text-right">Projetado</div>
            </div>

            {/* Lista de contas */}
            <div className="divide-y divide-border/40 max-h-[280px] overflow-y-auto">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className={`grid grid-cols-[auto_1fr_1fr_1fr] gap-3 items-center py-2.5 px-1 transition-opacity ${
                    !conta.visible ? "opacity-40" : ""
                  }`}
                >
                  <Checkbox
                    checked={conta.visible}
                    onCheckedChange={() => toggleContaVisibility(conta.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <BankLogo bankName={conta.banco || conta.nome} size="sm" />
                    <span className="text-sm font-medium truncate text-foreground">
                      {conta.nome}
                    </span>
                  </div>
                  <div
                    className={`text-right text-sm font-semibold tabular-nums ${getValueColor(
                      conta.saldoConfirmado
                    )}`}
                  >
                    {showValues
                      ? formatCurrency(conta.saldoConfirmado)
                      : "••••••"}
                  </div>
                  <div
                    className={`text-right text-sm tabular-nums ${getValueColor(
                      conta.saldoProjetado
                    )} opacity-70`}
                  >
                    {showValues
                      ? formatCurrency(conta.saldoProjetado)
                      : "••••••"}
                  </div>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="border-t border-border/50 pt-3 mt-2">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-3 items-center px-1">
                <div className="w-5"></div>
                <div className="text-sm font-semibold text-foreground">Total</div>
                <div
                  className={`text-right font-bold tabular-nums ${getValueColor(
                    totalConfirmado
                  )}`}
                >
                  {showValues ? formatCurrency(totalConfirmado) : "••••••"}
                </div>
                <div
                  className={`text-right font-semibold tabular-nums ${getValueColor(
                    totalProjetado
                  )} opacity-70`}
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
