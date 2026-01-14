import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Download, 
  TrendingUp, 
  BarChart3,
  PieChart,
  TrendingDown,
  RefreshCw,
  CalendarIcon,
  Receipt,
  Wallet,
  DollarSign,
  Minus,
  Equal,
  FileText
} from "lucide-react";
import { exportToExcel, formatCurrency, formatDate } from "@/utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  data_vencimento: string;
  categoria_id: string | null;
  centro_custo_id: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
}

interface CentroCusto {
  id: string;
  nome: string;
}

const COLORS = [
  "hsl(142, 76%, 36%)", // Verde
  "hsl(217, 91%, 60%)", // Azul
  "hsl(262, 83%, 58%)", // Roxo
  "hsl(43, 96%, 56%)",  // Amarelo
  "hsl(24, 95%, 53%)",  // Laranja
  "hsl(0, 84%, 60%)",   // Vermelho
  "hsl(173, 58%, 39%)", // Teal
  "hsl(340, 82%, 52%)", // Rosa
];

const RelatoriosTab = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [dataInicial, setDataInicial] = useState<Date>(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date>(endOfMonth(new Date()));
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>("todos");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lancRes, catRes, centrosRes] = await Promise.all([
        supabase.from("lancamentos").select("*").order("data_vencimento", { ascending: false }),
        supabase.from("categorias").select("*").eq("ativo", true),
        supabase.from("centros_custo").select("*").eq("ativo", true),
      ]);

      if (lancRes.error) throw lancRes.error;
      if (catRes.error) throw catRes.error;
      if (centrosRes.error) throw centrosRes.error;

      setLancamentos(lancRes.data || []);
      setCategorias(catRes.data || []);
      setCentrosCusto(centrosRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lançamentos filtrados por período e centro de custo
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      const dataLanc = parseISO(l.data_vencimento);
      const dentroDoIntervalo = isWithinInterval(dataLanc, {
        start: dataInicial,
        end: dataFinal,
      });
      const matchesCentro = centroCustoFilter === "todos" || l.centro_custo_id === centroCustoFilter;
      return dentroDoIntervalo && matchesCentro;
    });
  }, [lancamentos, dataInicial, dataFinal, centroCustoFilter]);

  // Calcular totais
  const totais = useMemo(() => {
    const entradas = lancamentosFiltrados.filter(l => l.tipo === "entrada");
    const saidas = lancamentosFiltrados.filter(l => l.tipo === "saida");

    const totalEntradas = entradas
      .filter(l => l.status === "pago" || l.status === "recebido")
      .reduce((sum, l) => sum + Number(l.valor), 0);
    
    const totalSaidas = saidas
      .filter(l => l.status === "pago")
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const contasReceber = entradas.filter(l => l.status === "pendente");
    const contasPagar = saidas.filter(l => l.status === "pendente");

    const totalAReceber = contasReceber.reduce((sum, l) => sum + Number(l.valor), 0);
    const totalAPagar = contasPagar.reduce((sum, l) => sum + Number(l.valor), 0);

    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      contasReceber,
      contasPagar,
      totalAReceber,
      totalAPagar,
    };
  }, [lancamentosFiltrados]);

  // DRE Detalhado
  const dre = useMemo(() => {
    const categoriasEntrada = categorias.filter(c => c.tipo === "entrada");
    const categoriasSaida = categorias.filter(c => c.tipo === "saida");

    // Receita Bruta por categoria
    const receitasPorCategoria = categoriasEntrada.map(cat => {
      const valor = lancamentosFiltrados
        .filter(l => l.tipo === "entrada" && l.categoria_id === cat.id && (l.status === "pago" || l.status === "recebido"))
        .reduce((sum, l) => sum + Number(l.valor), 0);
      return { categoria: cat.nome, valor, cor: cat.cor };
    }).filter(r => r.valor > 0);

    const receitaBruta = receitasPorCategoria.reduce((sum, r) => sum + r.valor, 0);

    // Deduções e Impostos (categorias que contenham "imposto", "taxa", "dedução")
    const deducoesNomes = ["imposto", "taxa", "dedução", "tributo"];
    const deducoes = lancamentosFiltrados
      .filter(l => {
        if (l.tipo !== "saida" || l.status !== "pago") return false;
        const cat = categorias.find(c => c.id === l.categoria_id);
        return cat && deducoesNomes.some(n => cat.nome.toLowerCase().includes(n));
      })
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const receitaLiquida = receitaBruta - deducoes;

    // Custos (categorias que contenham "custo", "matéria", "produto")
    const custosNomes = ["custo", "matéria", "produto", "insumo", "mercadoria"];
    const custos = lancamentosFiltrados
      .filter(l => {
        if (l.tipo !== "saida" || l.status !== "pago") return false;
        const cat = categorias.find(c => c.id === l.categoria_id);
        return cat && custosNomes.some(n => cat.nome.toLowerCase().includes(n));
      })
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const lucroBruto = receitaLiquida - custos;

    // Despesas Operacionais (restante das saídas)
    const despesasOperacionais = lancamentosFiltrados
      .filter(l => {
        if (l.tipo !== "saida" || l.status !== "pago") return false;
        const cat = categorias.find(c => c.id === l.categoria_id);
        if (!cat) return true;
        const ehDeducao = deducoesNomes.some(n => cat.nome.toLowerCase().includes(n));
        const ehCusto = custosNomes.some(n => cat.nome.toLowerCase().includes(n));
        return !ehDeducao && !ehCusto;
      })
      .reduce((sum, l) => sum + Number(l.valor), 0);

    const lucroLiquido = lucroBruto - despesasOperacionais;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos,
      lucroBruto,
      despesasOperacionais,
      lucroLiquido,
      receitasPorCategoria,
    };
  }, [lancamentosFiltrados, categorias]);

  // Distribuição de Receitas (Pizza)
  const distribuicaoReceitas = useMemo(() => {
    const categoriasEntrada = categorias.filter(c => c.tipo === "entrada");
    const totalReceitas = lancamentosFiltrados
      .filter(l => l.tipo === "entrada" && (l.status === "pago" || l.status === "recebido"))
      .reduce((sum, l) => sum + Number(l.valor), 0);

    return categoriasEntrada.map((cat, index) => {
      const valor = lancamentosFiltrados
        .filter(l => l.tipo === "entrada" && l.categoria_id === cat.id && (l.status === "pago" || l.status === "recebido"))
        .reduce((sum, l) => sum + Number(l.valor), 0);
      const percentual = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0;
      return {
        nome: cat.nome,
        valor,
        percentual,
        cor: cat.cor || COLORS[index % COLORS.length],
      };
    }).filter(r => r.valor > 0);
  }, [lancamentosFiltrados, categorias]);

  // Evolução Mensal (últimos 12 meses)
  const evolucaoMensal = useMemo(() => {
    const meses: { mes: string; entradas: number; saidas: number; saldo: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const mesRef = subMonths(new Date(), i);
      const inicio = startOfMonth(mesRef);
      const fim = endOfMonth(mesRef);
      const label = format(mesRef, "MMM/yy", { locale: ptBR });

      const lancamentosMes = lancamentos.filter(l => {
        const dataLanc = parseISO(l.data_vencimento);
        return isWithinInterval(dataLanc, { start: inicio, end: fim });
      });

      const entradas = lancamentosMes
        .filter(l => l.tipo === "entrada" && (l.status === "pago" || l.status === "recebido"))
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const saidas = lancamentosMes
        .filter(l => l.tipo === "saida" && l.status === "pago")
        .reduce((sum, l) => sum + Number(l.valor), 0);

      meses.push({
        mes: label,
        entradas,
        saidas,
        saldo: entradas - saidas,
      });
    }

    return meses;
  }, [lancamentos]);

  // Fluxo de Caixa do período
  const fluxoCaixaPeriodo = useMemo(() => {
    const dias = new Map<string, { entradas: number; saidas: number }>();
    
    lancamentosFiltrados.forEach(l => {
      const data = l.data_vencimento;
      const atual = dias.get(data) || { entradas: 0, saidas: 0 };
      
      if (l.tipo === "entrada" && (l.status === "pago" || l.status === "recebido")) {
        atual.entradas += Number(l.valor);
      } else if (l.tipo === "saida" && l.status === "pago") {
        atual.saidas += Number(l.valor);
      }
      
      dias.set(data, atual);
    });

    let saldoAcumulado = 0;
    return Array.from(dias.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, valores]) => {
        saldoAcumulado += valores.entradas - valores.saidas;
        return {
          data: format(parseISO(data), "dd/MM", { locale: ptBR }),
          entradas: valores.entradas,
          saidas: valores.saidas,
          saldo: saldoAcumulado,
        };
      });
  }, [lancamentosFiltrados]);

  // Export functions
  const handleExportFluxoCaixaExcel = () => {
    const headers = ['Tipo', 'Valor'];
    const data = [
      ['Total de Entradas', formatCurrency(totais.totalEntradas)],
      ['Total de Saídas', formatCurrency(totais.totalSaidas)],
      ['Saldo Atual', formatCurrency(totais.saldo)]
    ];

    exportToExcel({
      headers,
      data,
      title: 'Fluxo de Caixa',
      filename: 'fluxo_caixa'
    });
  };

  const handleExportDREExcel = () => {
    const headers = ['Item', 'Valor'];
    const data = [
      ['Receita Bruta', formatCurrency(dre.receitaBruta)],
      ['(-) Deduções/Impostos', formatCurrency(dre.deducoes)],
      ['= Receita Líquida', formatCurrency(dre.receitaLiquida)],
      ['(-) Custos', formatCurrency(dre.custos)],
      ['= Lucro Bruto', formatCurrency(dre.lucroBruto)],
      ['(-) Despesas Operacionais', formatCurrency(dre.despesasOperacionais)],
      ['= Lucro Líquido', formatCurrency(dre.lucroLiquido)]
    ];

    exportToExcel({
      headers,
      data,
      title: 'DRE - Demonstração do Resultado',
      filename: 'dre_resultado'
    });
  };

  const handleExportContasReceberExcel = () => {
    const headers = ['Descrição', 'Valor', 'Vencimento', 'Status'];
    const data = totais.contasReceber.map(conta => [
      conta.descricao,
      formatCurrency(conta.valor),
      formatDate(conta.data_vencimento),
      conta.status
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Contas a Receber',
      filename: 'contas_receber'
    });
  };

  const handleExportContasPagarExcel = () => {
    const headers = ['Descrição', 'Valor', 'Vencimento', 'Status'];
    const data = totais.contasPagar.map(conta => [
      conta.descricao,
      formatCurrency(conta.valor),
      formatDate(conta.data_vencimento),
      conta.status
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Contas a Pagar',
      filename: 'contas_pagar'
    });
  };

  const handleExportEvolucaoExcel = () => {
    const headers = ['Mês', 'Entradas', 'Saídas', 'Saldo'];
    const data = evolucaoMensal.map(m => [
      m.mes,
      formatCurrency(m.entradas),
      formatCurrency(m.saidas),
      formatCurrency(m.saldo)
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Evolução Mensal',
      filename: 'evolucao_mensal'
    });
  };

  const handleExportDistribuicaoExcel = () => {
    const headers = ['Categoria', '% Receita', 'Valor'];
    const data = distribuicaoReceitas.map(d => [
      d.nome,
      `${d.percentual.toFixed(1)}%`,
      formatCurrency(d.valor)
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Distribuição de Receitas',
      filename: 'distribuicao_receitas'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-entrada/20 text-entrada border border-entrada/30">Pago</Badge>;
      case "recebido":
        return <Badge className="bg-entrada/20 text-entrada border border-entrada/30">Recebido</Badge>;
      case "pendente":
        return <Badge className="bg-pendente/20 text-pendente border border-pendente/30">Pendente</Badge>;
      case "atrasado":
        return <Badge className="bg-saida/20 text-saida border border-saida/30">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2 text-sm text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs" style={{ color: entry.color }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-american-captain text-foreground">
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground">
            Análises e demonstrativos financeiros
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros Globais */}
      <Card className="h-molina-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Data Inicial */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicial && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicial ? format(dataInicial, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicial}
                    onSelect={(date) => date && setDataInicial(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFinal && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFinal ? format(dataFinal, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFinal}
                    onSelect={(date) => date && setDataFinal(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Centro de Custo</Label>
              <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="todos">Todos</SelectItem>
                  {centrosCusto.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Período */}
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{lancamentosFiltrados.length}</span> lançamentos no período
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral - Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Lançamentos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{lancamentosFiltrados.length}</p>
          </CardContent>
        </Card>
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-entrada" />
              <span className="text-xs text-muted-foreground">Entradas</span>
            </div>
            <p className="text-2xl font-bold text-entrada">{formatCurrency(totais.totalEntradas)}</p>
          </CardContent>
        </Card>
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-saida" />
              <span className="text-xs text-muted-foreground">Saídas</span>
            </div>
            <p className="text-2xl font-bold text-saida">{formatCurrency(totais.totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Saldo</span>
            </div>
            <p className={cn("text-2xl font-bold", totais.saldo >= 0 ? "text-entrada" : "text-saida")}>
              {formatCurrency(totais.saldo)}
            </p>
          </CardContent>
        </Card>
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-entrada" />
              <span className="text-xs text-muted-foreground">A Receber</span>
            </div>
            <p className="text-2xl font-bold text-entrada">{formatCurrency(totais.totalAReceber)}</p>
          </CardContent>
        </Card>
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-saida" />
              <span className="text-xs text-muted-foreground">A Pagar</span>
            </div>
            <p className="text-2xl font-bold text-saida">{formatCurrency(totais.totalAPagar)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa com Gráfico */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Fluxo de Caixa</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportFluxoCaixaExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-entrada/10 rounded-lg border border-entrada/30">
              <p className="text-sm text-muted-foreground">+ Entradas (Pagas)</p>
              <p className="text-lg font-medium text-entrada">{formatCurrency(totais.totalEntradas)}</p>
            </div>
            <div className="p-4 bg-saida/10 rounded-lg border border-saida/30">
              <p className="text-sm text-muted-foreground">- Saídas (Pagas)</p>
              <p className="text-lg font-medium text-saida">{formatCurrency(totais.totalSaidas)}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">= Saldo Atual</p>
              <p className={`text-lg font-medium ${totais.saldo >= 0 ? 'text-entrada' : 'text-saida'}`}>
                {formatCurrency(totais.saldo)}
              </p>
            </div>
          </div>
          
          {fluxoCaixaPeriodo.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={fluxoCaixaPeriodo}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem dados para o período selecionado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DRE Detalhado */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>DRE - Demonstração do Resultado</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportDREExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Receita Bruta */}
            <div className="flex justify-between items-center p-3 bg-entrada/10 rounded-lg border border-entrada/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-entrada" />
                <span className="font-medium">Receita Bruta</span>
              </div>
              <span className="text-lg font-bold text-entrada">{formatCurrency(dre.receitaBruta)}</span>
            </div>
            
            {/* Deduções */}
            <div className="flex justify-between items-center p-3 bg-saida/5 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-saida" />
                <span className="text-muted-foreground">(-) Deduções/Impostos</span>
              </div>
              <span className="font-medium text-saida">{formatCurrency(dre.deducoes)}</span>
            </div>
            
            {/* Receita Líquida */}
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Equal className="w-4 h-4" />
                <span className="font-semibold">= Receita Líquida</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(dre.receitaLiquida)}</span>
            </div>
            
            {/* Custos */}
            <div className="flex justify-between items-center p-3 bg-saida/5 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-saida" />
                <span className="text-muted-foreground">(-) Custos (Produtos/Mercadorias)</span>
              </div>
              <span className="font-medium text-saida">{formatCurrency(dre.custos)}</span>
            </div>
            
            {/* Lucro Bruto */}
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Equal className="w-4 h-4" />
                <span className="font-semibold">= Lucro Bruto</span>
              </div>
              <span className={cn("text-lg font-bold", dre.lucroBruto >= 0 ? "text-entrada" : "text-saida")}>
                {formatCurrency(dre.lucroBruto)}
              </span>
            </div>
            
            {/* Despesas Operacionais */}
            <div className="flex justify-between items-center p-3 bg-saida/5 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-saida" />
                <span className="text-muted-foreground">(-) Despesas Operacionais</span>
              </div>
              <span className="font-medium text-saida">{formatCurrency(dre.despesasOperacionais)}</span>
            </div>
            
            {/* Lucro Líquido */}
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center gap-2">
                <Equal className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">= LUCRO LÍQUIDO</span>
              </div>
              <span className={cn("text-2xl font-bold", dre.lucroLiquido >= 0 ? "text-entrada" : "text-saida")}>
                {formatCurrency(dre.lucroLiquido)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Receitas e Evolução Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Receitas (Pizza) */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Distribuição de Receitas</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportDistribuicaoExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {distribuicaoReceitas.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={distribuicaoReceitas}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="valor"
                      nameKey="nome"
                      label={({ nome, percentual }) => `${nome}: ${percentual.toFixed(1)}%`}
                      labelLine={false}
                    >
                      {distribuicaoReceitas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                {/* Tabela de detalhes */}
                <div className="space-y-2">
                  {distribuicaoReceitas.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                        <span className="text-sm">{item.nome}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                        <span className="text-sm font-medium">{formatCurrency(item.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sem receitas no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal (Barras) */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Evolução Mensal (12 meses)</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportEvolucaoExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Contas a Receber e a Pagar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Receber */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-entrada" />
                <span>Contas a Receber</span>
                <Badge variant="secondary">{totais.contasReceber.length}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasReceberExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totais.contasReceber.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conta a receber no período</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {totais.contasReceber.slice(0, 10).map((conta) => (
                    <div key={conta.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">Venc: {formatDate(conta.data_vencimento)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-entrada">{formatCurrency(conta.valor)}</span>
                        {getStatusBadge(conta.status)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total a Receber</span>
                    <span className="text-lg font-bold text-entrada">{formatCurrency(totais.totalAReceber)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contas a Pagar */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-saida" />
                <span>Contas a Pagar</span>
                <Badge variant="secondary">{totais.contasPagar.length}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasPagarExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totais.contasPagar.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conta a pagar no período</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {totais.contasPagar.slice(0, 10).map((conta) => (
                    <div key={conta.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">Venc: {formatDate(conta.data_vencimento)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-saida">{formatCurrency(conta.valor)}</span>
                        {getStatusBadge(conta.status)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total a Pagar</span>
                    <span className="text-lg font-bold text-saida">{formatCurrency(totais.totalAPagar)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatoriosTab;