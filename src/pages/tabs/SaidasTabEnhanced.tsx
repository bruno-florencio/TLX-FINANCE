import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  Check,
  Download,
  Calendar,
  DollarSign
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";

const SaidasTabEnhanced = () => {
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Mock data com centro de custo
  const [saidas, setSaidas] = useState([
    { 
      id: "1", 
      data: "2024-01-15", 
      descricao: "Pagamento Fornecedor ABC", 
      valor: 1500.00, 
      categoria: "Fornecedores",
      fornecedor: "ABC Ltda",
      centroCusto: "Produção",
      conta: "Conta Corrente BB",
      status: "pendente" 
    },
    { 
      id: "2", 
      data: "2024-01-14", 
      descricao: "Aluguel do Escritório", 
      valor: 2200.00, 
      categoria: "Despesas Fixas",
      fornecedor: "Imobiliária XYZ",
      centroCusto: "Administrativo",
      conta: "Conta Corrente BB",
      status: "pago" 
    },
    { 
      id: "3", 
      data: "2024-01-12", 
      descricao: "Material de Escritório", 
      valor: 350.00, 
      categoria: "Suprimentos",
      fornecedor: "Papelaria 123",
      centroCusto: "Administrativo",
      conta: "Cartão Corporativo",
      status: "pendente" 
    },
    { 
      id: "4", 
      data: "2024-01-10", 
      descricao: "Energia Elétrica", 
      valor: 480.00, 
      categoria: "Utilidades",
      fornecedor: "Companhia Elétrica",
      centroCusto: "Infraestrutura",
      conta: "Débito Automático",
      status: "atrasado" 
    }
  ]);

  const totalSaidas = saidas.reduce((acc, saida) => acc + saida.valor, 0);
  const saidasPendentes = saidas.filter(s => s.status === "pendente").length;

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

  const handleMarkAsPaid = (id: string) => {
    setSaidas(prev => 
      prev.map(s => 
        s.id === id ? { ...s, status: "pago" } : s
      )
    );
    toast({
      title: "Pagamento Confirmado",
      description: "Saída marcada como paga com sucesso.",
    });
  };

  const handleEdit = (saida: any) => {
    toast({
      title: "Editar Saída",
      description: `Funcionalidade de edição para: ${saida.descricao}`,
    });
  };

  const handleDelete = (id: string) => {
    setSaidas(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Saída Excluída",
      description: "A saída foi removida com sucesso.",
      variant: "destructive"
    });
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Fornecedor', 'Centro de Custo', 'Conta', 'Status'];
    const data = saidas.map(s => [
      formatDate(s.data),
      s.descricao,
      formatCurrency(s.valor),
      s.categoria,
      s.fornecedor,
      s.centroCusto,
      s.conta,
      s.status
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Relatório de Saídas',
      filename: 'saidas_financeiras'
    });
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Fornecedor', 'Centro de Custo', 'Conta', 'Status'];
    const data = saidas.map(s => [
      formatDate(s.data),
      s.descricao,
      formatCurrency(s.valor),
      s.categoria,
      s.fornecedor,
      s.centroCusto,
      s.conta,
      s.status
    ]);

    exportToPDF({
      headers,
      data,
      title: 'Relatório de Saídas - H MOLINA',
      filename: 'saidas_financeiras'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
          Gestão de Saídas
        </h1>
        <p className="text-muted-foreground">
          Controle completo de pagamentos do sistema H MOLINA
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingDown className="w-8 h-8 text-saida" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Saídas</p>
                <p className="text-2xl font-bold text-saida">{formatCurrency(totalSaidas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-pendente" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-pendente">{saidasPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold text-primary">{saidas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações e Listagem */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5" />
              <span>Lançamentos de Saída</span>
            </div>
            <div className="flex space-x-2">
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Check className="w-4 h-4 mr-2" />
                    Pagar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="valorPagamento">Valor Pago</Label>
                      <Input id="valorPagamento" type="number" placeholder="0,00" />
                    </div>
                    <div>
                      <Label htmlFor="contaPagamento">Conta de Origem</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bb">Conta Corrente BB</SelectItem>
                          <SelectItem value="nubank">Conta Digital Nubank</SelectItem>
                          <SelectItem value="caixa">Poupança Caixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                      <Input id="dataPagamento" type="date" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => {
                        setPaymentDialogOpen(false);
                        toast({
                          title: "Pagamento Registrado",
                          description: "O pagamento foi confirmado com sucesso.",
                        });
                      }}>
                        Confirmar Pagamento
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Saída
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Saída</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input id="descricao" placeholder="Descrição da saída" />
                      </div>
                      <div>
                        <Label htmlFor="valor">Valor</Label>
                        <Input id="valor" type="number" placeholder="0,00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fornecedores">Fornecedores</SelectItem>
                            <SelectItem value="despesas">Despesas Fixas</SelectItem>
                            <SelectItem value="suprimentos">Suprimentos</SelectItem>
                            <SelectItem value="utilidades">Utilidades</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="centroCusto">Centro de Custo</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar centro de custo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="producao">Produção</SelectItem>
                            <SelectItem value="administrativo">Administrativo</SelectItem>
                            <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fornecedor">Fornecedor</Label>
                        <Input id="fornecedor" placeholder="Nome do fornecedor" />
                      </div>
                      <div>
                        <Label htmlFor="data">Data</Label>
                        <Input id="data" type="date" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => {
                        setAddDialogOpen(false);
                        toast({
                          title: "Saída Cadastrada",
                          description: "Nova saída foi adicionada com sucesso.",
                        });
                      }}>
                        Salvar Saída
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
            {saidas.map((saida) => (
              <div 
                key={saida.id} 
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{saida.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(saida.data)} • {saida.fornecedor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {saida.categoria} • {saida.centroCusto} • {saida.conta}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-lg font-medium text-saida">
                          {formatCurrency(saida.valor)}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(saida.status)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {saida.status !== "pago" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMarkAsPaid(saida.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(saida)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(saida.id)}>
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

export default SaidasTabEnhanced;