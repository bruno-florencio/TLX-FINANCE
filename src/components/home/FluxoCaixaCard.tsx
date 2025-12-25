import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conta {
  id: string;
  nome: string;
  selected: boolean;
}

interface ChartDataPoint {
  dia: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export const FluxoCaixaCard = () => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [contasRes, lancamentosRes] = await Promise.all([
        supabase
          .from("contas_bancarias")
          .select("id, nome")
          .eq("ativo", true)
          .neq("tipo", "cartao_credito")
          .order("nome"),
        supabase
          .from("lancamentos")
          .select("*")
          .order("data_vencimento"),
      ]);

      if (contasRes.error) throw contasRes.error;
      if (lancamentosRes.error) throw lancamentosRes.error;

      const contasFormatadas = (contasRes.data || []).map((c) => ({
        ...c,
        selected: true,
      }));

      setContas(contasFormatadas);
      prepareChartData(
        lancamentosRes.data || [],
        contasFormatadas.map((c) => c.id)
      );
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async (
    lancamentos: any[],
    contasIds: string[]
  ) => {
    const inicio = startOfMonth(mesAtual);
    const fim = endOfMonth(mesAtual);
    const dias = eachDayOfInterval({ start: inicio, end: fim });

    const lancamentosAnteriores = lancamentos.filter((l) => {
      const dataLanc = new Date(l.data_vencimento);
      return dataLanc < inicio && contasIds.includes(l.conta_id);
    });

    const saldoInicial = lancamentosAnteriores.reduce((acc, l) => {
      if (l.tipo === "entrada" && l.status === "pago") {
        return acc + Number(l.valor);
      }
      if (l.tipo === "saida" && l.status === "pago") {
        return acc - Number(l.valor);
      }
      return acc;
    }, 0);

    let saldoAcumulado = saldoInicial;

    const dadosGrafico: ChartDataPoint[] = dias.map((dia) => {
      const diaFormatado = format(dia, "yyyy-MM-dd");
      const diaLabel = format(dia, "dd", { locale: ptBR });

      const lancamentosDia = lancamentos.filter((l) => {
        const dataLanc = format(parseISO(l.data_vencimento), "yyyy-MM-dd");
        return dataLanc === diaFormatado && contasIds.includes(l.conta_id);
      });

      const entradas = lancamentosDia
        .filter((l) => l.tipo === "entrada")
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const saidas = lancamentosDia
        .filter((l) => l.tipo === "saida")
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const saldo = entradas - saidas;
      saldoAcumulado += saldo;

      return {
        dia: diaLabel,
        entradas,
        saidas,
        saldo,
        saldoAcumulado,
      };
    });

    setChartData(dadosGrafico);
  };

  const toggleConta = (id: string) => {
    const newContas = contas.map((c) =>
      c.id === id ? { ...c, selected: !c.selected } : c
    );
    setContas(newContas);
    
    const selectedIds = newContas.filter((c) => c.selected).map((c) => c.id);
    if (selectedIds.length > 0) {
      supabase
        .from("lancamentos")
        .select("*")
        .order("data_vencimento")
        .then(({ data }) => {
          if (data) prepareChartData(data, selectedIds);
        });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2 text-sm text-foreground">Dia {label}</p>
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs"
              style={{ color: entry.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
              <span className="font-medium tabular-nums">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const saldoFinal =
    chartData.length > 0 ? chartData[chartData.length - 1].saldoAcumulado : 0;
  const totalEntradas = chartData.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas = chartData.reduce((sum, d) => sum + d.saidas, 0);

  return (
    <Card className="clean-card">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold text-foreground">
              Fluxo de Caixa
              <span className="font-normal text-muted-foreground ml-2 text-sm">
                {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
              </span>
            </CardTitle>
          </div>
          
          {/* Resumo */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-entrada" />
              <span className="text-muted-foreground text-xs">Entradas</span>
              <span className="font-semibold text-entrada tabular-nums text-sm">
                {formatCurrency(totalEntradas)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-saida" />
              <span className="text-muted-foreground text-xs">Saídas</span>
              <span className="font-semibold text-saida tabular-nums text-sm">
                {formatCurrency(totalSaidas)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Saldo</span>
              <span
                className={`font-bold tabular-nums ${
                  saldoFinal >= 0 ? "text-entrada" : "text-saida"
                }`}
              >
                {formatCurrency(saldoFinal)}
              </span>
            </div>
          </div>
        </div>

        {/* Filtro de contas */}
        {contas.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {contas.map((conta) => (
              <label
                key={conta.id}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Checkbox
                  checked={conta.selected}
                  onCheckedChange={() => toggleConta(conta.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5"
                />
                <span className="text-xs text-muted-foreground">
                  {conta.nome}
                </span>
              </label>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-[260px]">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem dados para exibir</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSaldoClean" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="dia"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="saldoAcumulado"
                name="Saldo"
                stroke="hsl(var(--primary))"
                fill="url(#colorSaldoClean)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
