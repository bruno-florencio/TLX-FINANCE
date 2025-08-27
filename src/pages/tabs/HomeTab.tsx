import { useEffect, useState } from "react";
import FinanceCard from "@/components/cards/FinanceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const HomeTab = () => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totais, setTotais] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    contasAReceber: 0,
    contasAPagar: 0,
    saldoAtual: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [proximosRecebimentos, setProximosRecebimentos] = useState<any[]>([]);

  useEffect(() => {
    fetchLancamentos();
  }, []);

  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      
      // Busca todos os lançamentos
      const { data: lancamentosData, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order("data_lancamento", { ascending: true });

      if (error) throw error;

      if (lancamentosData) {
        setLancamentos(lancamentosData);
        calcularTotais(lancamentosData);
        prepararDadosGrafico(lancamentosData);
        prepararProximosVencimentos(lancamentosData);
      }
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotais = (lancamentos: any[]) => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    
    // Filtra lançamentos do mês atual
    const lancamentosMes = lancamentos.filter((l) => {
      const dataLancamento = new Date(l.data_lancamento);
      return dataLancamento >= inicioMes && dataLancamento <= fimMes;
    });

    // Calcula totais do mês
    const totalEntradas = lancamentosMes
      .filter((l) => l.tipo === "entrada")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const totalSaidas = lancamentosMes
      .filter((l) => l.tipo === "saida")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    // Contas a receber (entradas pendentes)
    const contasAReceber = lancamentos
      .filter((l) => l.tipo === "entrada" && l.status === "pendente")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    // Contas a pagar (saídas pendentes)
    const contasAPagar = lancamentos
      .filter((l) => l.tipo === "saida" && l.status === "pendente")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    // Saldo atual (todas as entradas pagas - todas as saídas pagas)
    const entradasPagas = lancamentos
      .filter((l) => l.tipo === "entrada" && l.status === "pago")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const saidasPagas = lancamentos
      .filter((l) => l.tipo === "saida" && l.status === "pago")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const saldoAtual = entradasPagas - saidasPagas;

    setTotais({
      totalEntradas,
      totalSaidas,
      contasAReceber,
      contasAPagar,
      saldoAtual,
    });
  };

  const prepararDadosGrafico = (lancamentos: any[]) => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    
    // Criar array com todos os dias do mês
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    // Agrupar lançamentos por dia
    const dadosPorDia = diasDoMes.map((dia) => {
      const diaFormatado = format(dia, "yyyy-MM-dd");
      const diaLabel = format(dia, "dd/MM");
      
      const entradasDia = lancamentos
        .filter((l) => {
          const dataLancamento = format(parseISO(l.data_lancamento), "yyyy-MM-dd");
          return dataLancamento === diaFormatado && l.tipo === "entrada";
        })
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const saidasDia = lancamentos
        .filter((l) => {
          const dataLancamento = format(parseISO(l.data_lancamento), "yyyy-MM-dd");
          return dataLancamento === diaFormatado && l.tipo === "saida";
        })
        .reduce((sum, l) => sum + Number(l.valor), 0);

      return {
        dia: diaLabel,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: entradasDia - saidasDia,
      };
    });

    setChartData(dadosPorDia);
  };

  const prepararProximosVencimentos = (lancamentos: any[]) => {
    const hoje = new Date();
    
    // Filtra lançamentos de saída pendentes com data de vencimento futura
    const vencimentos = lancamentos
      .filter((l) => {
        if (l.tipo !== "saida" || l.status !== "pendente" || !l.data_vencimento) return false;
        const dataVencimento = new Date(l.data_vencimento);
        return dataVencimento >= hoje;
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
      .slice(0, 5); // Pega os 5 próximos

    setProximosVencimentos(vencimentos);
    
    // Filtra lançamentos de entrada pendentes com data de vencimento futura
    const recebimentos = lancamentos
      .filter((l) => {
        if (l.tipo !== "entrada" || l.status !== "pendente" || !l.data_vencimento) return false;
        const dataVencimento = new Date(l.data_vencimento);
        return dataVencimento >= hoje;
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
      .slice(0, 5); // Pega os 5 próximos

    setProximosRecebimentos(recebimentos);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl text-foreground">
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema H MOLINA - {new Date().toLocaleDateString("pt-BR", { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <FinanceCard
          title="Saldo Atual"
          value={totais.saldoAtual}
          type="neutral"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle="Posição atual"
        />
        
        <FinanceCard
          title="Entradas do Mês"
          value={totais.totalEntradas}
          type="entrada"
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle="Mês atual"
        />
        
        <FinanceCard
          title="Saídas do Mês"
          value={totais.totalSaidas}
          type="saida"
          icon={<TrendingDown className="w-5 h-5" />}
          subtitle="Mês atual"
        />
        
        <FinanceCard
          title="Contas a Receber"
          value={totais.contasAReceber}
          type="entrada"
          icon={<Calendar className="w-5 h-5" />}
          subtitle="Pendentes"
        />
        
        <FinanceCard
          title="Contas a Pagar"
          value={totais.contasAPagar}
          type="warning"
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle="Pendentes"
        />
      </div>

      {/* Próximos Vencimentos e Recebimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Vencimentos */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-saida" />
              <span>Próximos Vencimentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosVencimentos.length > 0 ? (
                proximosVencimentos.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {formatDate(item.data_vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="saida-indicator">
                        {formatCurrency(item.valor)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum pagamento próximo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Recebimentos */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-entrada" />
              <span>Próximos Recebimentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosRecebimentos.length > 0 ? (
                proximosRecebimentos.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {formatDate(item.data_vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="entrada-indicator">
                        {formatCurrency(item.valor)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum recebimento próximo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Fluxo de Caixa - {format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--entrada))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--entrada))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--saida))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--saida))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="dia" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="rect"
                />
                <Area 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="hsl(var(--entrada))"
                  fill="url(#colorEntradas)"
                  name="Entradas"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke="hsl(var(--saida))"
                  fill="url(#colorSaidas)"
                  name="Saídas"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {loading ? "Carregando dados..." : "Nenhum lançamento no mês atual"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Área de Atualizações Futuras */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle>Atualizações e Funcionalidades Futuras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">📊 Gráficos Interativos</h4>
              <p className="text-xs text-muted-foreground">Implementação de charts dinâmicos para análise visual</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🔄 Integração Bancária</h4>
              <p className="text-xs text-muted-foreground">Conexão automática com bancos via Open Banking</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">📱 App Mobile</h4>
              <p className="text-xs text-muted-foreground">Versão mobile responsiva do sistema</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🤖 IA Financeira</h4>
              <p className="text-xs text-muted-foreground">Análises e sugestões inteligentes</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">📄 Relatórios Avançados</h4>
              <p className="text-xs text-muted-foreground">Export em PDF, Excel e análises personalizadas</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🔐 Multi-usuário</h4>
              <p className="text-xs text-muted-foreground">Sistema de permissões e colaboração</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeTab;