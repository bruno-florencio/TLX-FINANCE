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

const HomeTab = () => {
  // Mock data - futuramente será integrado com Supabase
  const mockData = {
    totalEntradas: 45230.50,
    totalSaidas: 32150.75,
    contasAReceber: 12800.00,
    contasAPagar: 8900.25,
    saldoAtual: 13079.75,
    entradasMes: "+12.5%",
    saidasMes: "+8.3%",
    proximosVencimentos: [
      { id: 1, description: "Pagamento Fornecedor ABC", value: 2500.00, date: "2024-01-15", type: "saida" },
      { id: 2, description: "Recebimento Cliente XYZ", value: 4200.00, date: "2024-01-16", type: "entrada" },
      { id: 3, description: "Aluguel", value: 1800.00, date: "2024-01-20", type: "saida" },
    ]
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
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
          value={mockData.saldoAtual}
          type="neutral"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle="Posição atual"
        />
        
        <FinanceCard
          title="Entradas do Mês"
          value={mockData.totalEntradas}
          type="entrada"
          icon={<TrendingUp className="w-5 h-5" />}
          change={{
            value: mockData.entradasMes,
            type: "positive"
          }}
        />
        
        <FinanceCard
          title="Saídas do Mês"
          value={mockData.totalSaidas}
          type="saida"
          icon={<TrendingDown className="w-5 h-5" />}
          change={{
            value: mockData.saidasMes,
            type: "negative"
          }}
        />
        
        <FinanceCard
          title="Contas a Receber"
          value={mockData.contasAReceber}
          type="entrada"
          icon={<Calendar className="w-5 h-5" />}
          subtitle="Próximos 30 dias"
        />
        
        <FinanceCard
          title="Contas a Pagar"
          value={mockData.contasAPagar}
          type="warning"
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle="Próximos 30 dias"
        />
      </div>

      {/* Próximos Vencimentos e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Vencimentos */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Próximos Vencimentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.proximosVencimentos.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={item.type === "entrada" ? "entrada-indicator" : "saida-indicator"}
                    >
                      {formatCurrency(item.value)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Área reservada para Gráficos */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Fluxo de Caixa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted/20 rounded-lg border-2 border-dashed border-border">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gráfico será implementado</p>
                <p className="text-xs text-muted-foreground">Integração futura com dados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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