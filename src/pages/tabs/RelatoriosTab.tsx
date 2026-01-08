import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  TrendingUp, 
  BarChart3,
  PieChart,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { exportToExcel, formatCurrency, formatDate } from "@/utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  data_vencimento: string;
}

const RelatoriosTab = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais a partir dos dados reais
  const entradas = lancamentos.filter(l => l.tipo === "entrada");
  const saidas = lancamentos.filter(l => l.tipo === "saida");

  const totalEntradas = entradas
    .filter(l => l.status === "pago")
    .reduce((sum, l) => sum + Number(l.valor), 0);
  
  const totalSaidas = saidas
    .filter(l => l.status === "pago")
    .reduce((sum, l) => sum + Number(l.valor), 0);

  const saldoAtual = totalEntradas - totalSaidas;

  const contasReceber = entradas.filter(l => l.status === "pendente");
  const contasPagar = saidas.filter(l => l.status === "pendente");

  const totalAReceber = contasReceber.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalAPagar = contasPagar.reduce((sum, l) => sum + Number(l.valor), 0);

  const handleExportFluxoCaixaExcel = () => {
    const headers = ['Tipo', 'Valor'];
    const data = [
      ['Total de Entradas', formatCurrency(totalEntradas)],
      ['Total de Saídas', formatCurrency(totalSaidas)],
      ['Saldo Atual', formatCurrency(saldoAtual)]
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
      ['Receitas Totais', formatCurrency(totalEntradas)],
      ['Despesas Totais', formatCurrency(totalSaidas)],
      ['Resultado Líquido', formatCurrency(saldoAtual)]
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
    const data = contasReceber.map(conta => [
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
    const data = contasPagar.map(conta => [
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="pago-indicator">Pago</Badge>;
      case "pendente":
        return <Badge className="pendente-indicator">Pendente</Badge>;
      case "atrasado":
        return <Badge className="atrasado-indicator">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
      <div className="flex items-center justify-between">
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

      {/* Fluxo de Caixa */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-entrada/10 rounded-lg border border-entrada/30">
              <p className="text-sm text-muted-foreground">+ Entradas (Pagas)</p>
              <p className="text-lg font-medium text-entrada">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="p-4 bg-saida/10 rounded-lg border border-saida/30">
              <p className="text-sm text-muted-foreground">- Saídas (Pagas)</p>
              <p className="text-lg font-medium text-saida">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">= Saldo Atual</p>
              <p className={`text-lg font-medium ${saldoAtual >= 0 ? 'text-entrada' : 'text-saida'}`}>
                {formatCurrency(saldoAtual)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRE Simplificado */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>DRE - Demonstração do Resultado</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportDREExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-entrada/10 rounded-lg border border-entrada/30">
              <span className="font-medium">Receitas Totais</span>
              <span className="text-lg font-bold text-entrada">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-saida/10 rounded-lg border border-saida/30">
              <span className="font-medium">(-) Despesas Totais</span>
              <span className="text-lg font-bold text-saida">{formatCurrency(totalSaidas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-bold">= Resultado Líquido</span>
              <span className={`text-xl font-bold ${saldoAtual >= 0 ? 'text-entrada' : 'text-saida'}`}>
                {formatCurrency(saldoAtual)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contas a Receber e a Pagar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Receber */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Contas a Receber</span>
                <Badge variant="secondary">{contasReceber.length}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasReceberExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasReceber.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conta a receber</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contasReceber.slice(0, 5).map((conta) => (
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
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total a Receber</span>
                    <span className="text-lg font-bold text-entrada">{formatCurrency(totalAReceber)}</span>
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
                <TrendingDown className="w-5 h-5" />
                <span>Contas a Pagar</span>
                <Badge variant="secondary">{contasPagar.length}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasPagarExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasPagar.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conta a pagar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contasPagar.slice(0, 5).map((conta) => (
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
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total a Pagar</span>
                    <span className="text-lg font-bold text-saida">{formatCurrency(totalAPagar)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Área para Gráficos Futuros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Distribuição de Receitas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg border-2 border-dashed border-border">
              <div className="text-center space-y-2">
                <PieChart className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gráfico de Pizza</p>
                <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Evolução Mensal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg border-2 border-dashed border-border">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gráfico de Barras</p>
                <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatoriosTab;
