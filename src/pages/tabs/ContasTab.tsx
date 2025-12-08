import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Banknote, 
  ArrowUpDown, 
  Plus, 
  Download, 
  Edit, 
  Trash2,
  Calculator,
  CreditCard
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";

const ContasTab = () => {
  const [selectedAccount, setSelectedAccount] = useState("todos");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Mock data para demonstração
  const mockAccounts = [
    { id: "1", nome: "Conta Corrente Banco do Brasil", saldo: 25430.75, tipo: "corrente" },
    { id: "2", nome: "Poupança Caixa", saldo: 15800.00, tipo: "poupanca" },
    { id: "3", nome: "Conta Digital Nubank", saldo: 3250.50, tipo: "corrente" },
    { id: "4", nome: "Investimentos", saldo: 45000.00, tipo: "investimento" }
  ];

  const mockTransactions = [
    { 
      id: "1", 
      data: "2024-01-15", 
      descricao: "Transferência PIX - João Silva", 
      valor: -1500.00, 
      tipo: "saida",
      conta: "Conta Corrente Banco do Brasil",
      categoria: "Transferência",
      centroCusto: "Operacional",
      status: "conciliado"
    },
    { 
      id: "2", 
      data: "2024-01-14", 
      descricao: "Recebimento Cliente ABC", 
      valor: 5200.00, 
      tipo: "entrada",
      conta: "Conta Digital Nubank",
      categoria: "Vendas",
      centroCusto: "Comercial",
      status: "conciliado"
    },
    { 
      id: "3", 
      data: "2024-01-13", 
      descricao: "Pagamento Fornecedor XYZ", 
      valor: -850.00, 
      tipo: "saida",
      conta: "Conta Corrente Banco do Brasil",
      categoria: "Fornecedores",
      centroCusto: "Produção",
      status: "pendente"
    },
    { 
      id: "4", 
      data: "2024-01-12", 
      descricao: "Aplicação Rendimento", 
      valor: 320.50, 
      tipo: "entrada",
      conta: "Investimentos",
      categoria: "Rendimentos",
      centroCusto: "Financeiro",
      status: "conciliado"
    }
  ];

  const totalSaldo = mockAccounts.reduce((acc, conta) => acc + conta.saldo, 0);

  const filteredTransactions = selectedAccount === "todos" 
    ? mockTransactions 
    : mockTransactions.filter(t => 
        mockAccounts.find(a => a.nome === t.conta)?.id === selectedAccount
      );

  const getAccountIcon = (tipo: string) => {
    switch (tipo) {
      case "corrente": return <CreditCard className="w-4 h-4" />;
      case "poupanca": return <Banknote className="w-4 h-4" />;
      case "investimento": return <Calculator className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "conciliado":
        return <Badge className="pago-indicator">Conciliado</Badge>;
      case "pendente":
        return <Badge className="pendente-indicator">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Conta', 'Categoria', 'Centro de Custo', 'Status'];
    const data = filteredTransactions.map(t => [
      formatDate(t.data),
      t.descricao,
      formatCurrency(t.valor),
      t.tipo,
      t.conta,
      t.categoria,
      t.centroCusto,
      t.status
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Extratos Bancários',
      filename: 'extratos_bancarios'
    });
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Conta', 'Categoria', 'Centro de Custo', 'Status'];
    const data = filteredTransactions.map(t => [
      formatDate(t.data),
      t.descricao,
      formatCurrency(t.valor),
      t.tipo,
      t.conta,
      t.categoria,
      t.centroCusto,
      t.status
    ]);

    exportToPDF({
      headers,
      data,
      title: 'Extratos Bancários - TECHLABX',
      filename: 'extratos_bancarios'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
          Contas e Extratos
        </h1>
        <p className="text-muted-foreground">
          Gestão e conciliação bancária do sistema TECHLABX
        </p>
      </div>

      {/* Resumo das Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockAccounts.map((conta) => (
          <Card key={conta.id} className="h-molina-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getAccountIcon(conta.tipo)}
                  <div>
                    <p className="font-medium text-sm">{conta.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{conta.tipo}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(conta.saldo)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Geral */}
      <Card className="h-molina-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total Consolidado</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalSaldo)}</p>
            </div>
            <div className="flex space-x-2">
              <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Transferir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transferência entre Contas</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contaOrigem">Conta de Origem</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockAccounts.map(conta => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contaDestino">Conta de Destino</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockAccounts.map(conta => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="valor">Valor</Label>
                      <Input id="valor" type="number" placeholder="0,00" />
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input id="descricao" placeholder="Descrição da transferência" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setTransferDialogOpen(false)}>
                        Transferir
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Extratos */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Banknote className="w-5 h-5" />
              <span>Extratos Bancários</span>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Contas</SelectItem>
                  {mockAccounts.map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transacao) => (
              <div 
                key={transacao.id} 
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{transacao.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transacao.data)} • {transacao.conta}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transacao.categoria} • {transacao.centroCusto}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span 
                          className={`text-lg font-medium ${
                            transacao.valor >= 0 ? 'text-entrada' : 'text-saida'
                          }`}
                        >
                          {formatCurrency(transacao.valor)}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(transacao.status)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContasTab;