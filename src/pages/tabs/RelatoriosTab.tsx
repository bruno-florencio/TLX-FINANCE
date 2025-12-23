import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  TrendingDown
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";

const RelatoriosTab = () => {
  // Mock data para demonstração
  const mockReports = {
    fluxoCaixa: {
      saldoAnterior: 15000.00,
      entradas: 45230.50,
      saidas: 32150.75,
      saldoAtual: 28079.75
    },
    dre: {
      receitas: 45230.50,
      custosVendas: 18500.00,
      lucroBruto: 26730.50,
      despesasOperacionais: 13650.75,
      lucroLiquido: 13079.75
    },
    contasReceber: [
      { cliente: "Empresa ABC", valor: 2500.00, vencimento: "2024-01-15", status: "pendente" },
      { cliente: "Cliente XYZ", valor: 3200.00, vencimento: "2024-01-18", status: "pendente" },
      { cliente: "Consultoria 123", valor: 1800.00, vencimento: "2024-01-12", status: "atrasado" }
    ],
    contasPagar: [
      { fornecedor: "Fornecedor ABC", valor: 1500.00, vencimento: "2024-01-15", status: "pendente" },
      { fornecedor: "Energia Elétrica", valor: 480.00, vencimento: "2024-01-08", status: "atrasado" },
      { fornecedor: "Aluguel", valor: 2200.00, vencimento: "2024-01-20", status: "pendente" }
    ]
  };

  const handleExportFluxoCaixaExcel = () => {
    const headers = ['Tipo', 'Valor'];
    const data = [
      ['Saldo Anterior', formatCurrency(mockReports.fluxoCaixa.saldoAnterior)],
      ['Entradas', formatCurrency(mockReports.fluxoCaixa.entradas)],
      ['Saídas', formatCurrency(mockReports.fluxoCaixa.saidas)],
      ['Saldo Atual', formatCurrency(mockReports.fluxoCaixa.saldoAtual)]
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
      ['Receitas Totais', formatCurrency(mockReports.dre.receitas)],
      ['Custos das Vendas', formatCurrency(mockReports.dre.custosVendas)],
      ['Lucro Bruto', formatCurrency(mockReports.dre.lucroBruto)],
      ['Despesas Operacionais', formatCurrency(mockReports.dre.despesasOperacionais)],
      ['Lucro Líquido', formatCurrency(mockReports.dre.lucroLiquido)]
    ];

    exportToExcel({
      headers,
      data,
      title: 'DRE - Demonstração do Resultado',
      filename: 'dre_resultado'
    });
  };

  const handleExportContasReceberExcel = () => {
    const headers = ['Cliente', 'Valor', 'Vencimento', 'Status'];
    const data = mockReports.contasReceber.map(conta => [
      conta.cliente,
      formatCurrency(conta.valor),
      formatDate(conta.vencimento),
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
    const headers = ['Fornecedor', 'Valor', 'Vencimento', 'Status'];
    const data = mockReports.contasPagar.map(conta => [
      conta.fornecedor,
      formatCurrency(conta.valor),
      formatDate(conta.vencimento),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
          Relatórios Financeiros
        </h1>
        <p className="text-muted-foreground">
          Análises e demonstrativos financeiros
        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Saldo Anterior</p>
              <p className="text-lg font-medium">{formatCurrency(mockReports.fluxoCaixa.saldoAnterior)}</p>
            </div>
            <div className="p-4 bg-entrada/10 rounded-lg border border-entrada/30">
              <p className="text-sm text-muted-foreground">+ Entradas</p>
              <p className="text-lg font-medium text-entrada">{formatCurrency(mockReports.fluxoCaixa.entradas)}</p>
            </div>
            <div className="p-4 bg-saida/10 rounded-lg border border-saida/30">
              <p className="text-sm text-muted-foreground">- Saídas</p>
              <p className="text-lg font-medium text-saida">{formatCurrency(mockReports.fluxoCaixa.saidas)}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-muted-foreground">= Saldo Atual</p>
              <p className="text-lg font-medium text-primary">{formatCurrency(mockReports.fluxoCaixa.saldoAtual)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRE - Demonstração do Resultado do Exercício */}
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
              <span className="text-lg font-bold text-entrada">{formatCurrency(mockReports.dre.receitas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-saida/10 rounded-lg border border-saida/30">
              <span className="font-medium">(-) Custos das Vendas</span>
              <span className="text-lg font-bold text-saida">{formatCurrency(mockReports.dre.custosVendas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg border border-border">
              <span className="font-medium">= Lucro Bruto</span>
              <span className="text-lg font-bold">{formatCurrency(mockReports.dre.lucroBruto)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-saida/10 rounded-lg border border-saida/30">
              <span className="font-medium">(-) Despesas Operacionais</span>
              <span className="text-lg font-bold text-saida">{formatCurrency(mockReports.dre.despesasOperacionais)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-bold">= Lucro Líquido</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(mockReports.dre.lucroLiquido)}</span>
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
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasReceberExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockReports.contasReceber.map((conta, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{conta.cliente}</p>
                    <p className="text-xs text-muted-foreground">Venc: {formatDate(conta.vencimento)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-entrada">{formatCurrency(conta.valor)}</span>
                    {getStatusBadge(conta.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contas a Pagar */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5" />
                <span>Contas a Pagar</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportContasPagarExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockReports.contasPagar.map((conta, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{conta.fornecedor}</p>
                    <p className="text-xs text-muted-foreground">Venc: {formatDate(conta.vencimento)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-saida">{formatCurrency(conta.valor)}</span>
                    {getStatusBadge(conta.status)}
                  </div>
                </div>
              ))}
            </div>
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
                <p className="text-xs text-muted-foreground">Será implementado</p>
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
                <p className="text-xs text-muted-foreground">Será implementado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatoriosTab;