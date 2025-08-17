import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingUp, 
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

const EntradasTabEnhanced = () => {
  const { toast } = useToast();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Mock data com centro de custo
  const [entradas, setEntradas] = useState([
    { 
      id: "1", 
      data: "2024-01-15", 
      descricao: "Venda de Produto A", 
      valor: 2500.00, 
      categoria: "Vendas",
      cliente: "Empresa ABC Ltda",
      centroCusto: "Comercial",
      conta: "Conta Corrente BB",
      status: "pago" 
    },
    { 
      id: "2", 
      data: "2024-01-14", 
      descricao: "Consultoria Mensal", 
      valor: 3200.00, 
      categoria: "Serviços",
      cliente: "Cliente XYZ S.A.",
      centroCusto: "Consultoria",
      conta: "Conta Digital Nubank",
      status: "pendente" 
    },
    { 
      id: "3", 
      data: "2024-01-12", 
      descricao: "Venda de Produto B", 
      valor: 1800.00, 
      categoria: "Vendas",
      cliente: "Consultoria 123",
      centroCusto: "Comercial",
      conta: "Poupança Caixa",
      status: "atrasado" 
    },
    { 
      id: "4", 
      data: "2024-01-10", 
      descricao: "Treinamento Corporativo", 
      valor: 4500.00, 
      categoria: "Educação",
      cliente: "Corporação ABC",
      centroCusto: "Educação",
      conta: "Conta Corrente BB",
      status: "pendente" 
    }
  ]);

  const totalEntradas = entradas.reduce((acc, entrada) => acc + entrada.valor, 0);
  const entradasPendentes = entradas.filter(e => e.status === "pendente").length;

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
    setEntradas(prev => 
      prev.map(e => 
        e.id === id ? { ...e, status: "pago" } : e
      )
    );
    toast({
      title: "Recebimento Confirmado",
      description: "Entrada marcada como paga com sucesso.",
    });
  };

  const handleEdit = (entrada: any) => {
    toast({
      title: "Editar Entrada",
      description: `Funcionalidade de edição para: ${entrada.descricao}`,
    });
  };

  const handleDelete = (id: string) => {
    setEntradas(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Entrada Excluída",
      description: "A entrada foi removida com sucesso.",
      variant: "destructive"
    });
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Cliente', 'Centro de Custo', 'Conta', 'Status'];
    const data = entradas.map(e => [
      formatDate(e.data),
      e.descricao,
      formatCurrency(e.valor),
      e.categoria,
      e.cliente,
      e.centroCusto,
      e.conta,
      e.status
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Relatório de Entradas',
      filename: 'entradas_financeiras'
    });
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Cliente', 'Centro de Custo', 'Conta', 'Status'];
    const data = entradas.map(e => [
      formatDate(e.data),
      e.descricao,
      formatCurrency(e.valor),
      e.categoria,
      e.cliente,
      e.centroCusto,
      e.conta,
      e.status
    ]);

    exportToPDF({
      headers,
      data,
      title: 'Relatório de Entradas - H MOLINA',
      filename: 'entradas_financeiras'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
          Gestão de Entradas
        </h1>
        <p className="text-muted-foreground">
          Controle completo de recebimentos do sistema H MOLINA
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-entrada" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Entradas</p>
                <p className="text-2xl font-bold text-entrada">{formatCurrency(totalEntradas)}</p>
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
                <p className="text-2xl font-bold text-pendente">{entradasPendentes}</p>
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
                <p className="text-2xl font-bold text-primary">{entradas.length}</p>
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
              <TrendingUp className="w-5 h-5" />
              <span>Lançamentos de Entrada</span>
            </div>
            <div className="flex space-x-2">
              <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Check className="w-4 h-4 mr-2" />
                    Receber
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Recebimento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="valorRecebimento">Valor Recebido</Label>
                      <Input id="valorRecebimento" type="number" placeholder="0,00" />
                    </div>
                    <div>
                      <Label htmlFor="contaRecebimento">Conta de Destino</Label>
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
                      <Label htmlFor="dataRecebimento">Data do Recebimento</Label>
                      <Input id="dataRecebimento" type="date" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => {
                        setReceiveDialogOpen(false);
                        toast({
                          title: "Recebimento Registrado",
                          description: "O recebimento foi confirmado com sucesso.",
                        });
                      }}>
                        Confirmar Recebimento
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Entrada</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input id="descricao" placeholder="Descrição da entrada" />
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
                            <SelectItem value="vendas">Vendas</SelectItem>
                            <SelectItem value="servicos">Serviços</SelectItem>
                            <SelectItem value="consultoria">Consultoria</SelectItem>
                            <SelectItem value="educacao">Educação</SelectItem>
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
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="consultoria">Consultoria</SelectItem>
                            <SelectItem value="educacao">Educação</SelectItem>
                            <SelectItem value="operacional">Operacional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input id="cliente" placeholder="Nome do cliente" />
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
                          title: "Entrada Cadastrada",
                          description: "Nova entrada foi adicionada com sucesso.",
                        });
                      }}>
                        Salvar Entrada
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
            {entradas.map((entrada) => (
              <div 
                key={entrada.id} 
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{entrada.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entrada.data)} • {entrada.cliente}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entrada.categoria} • {entrada.centroCusto} • {entrada.conta}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-lg font-medium text-entrada">
                          {formatCurrency(entrada.valor)}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(entrada.status)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {entrada.status !== "pago" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMarkAsPaid(entrada.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entrada)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entrada.id)}>
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

export default EntradasTabEnhanced;