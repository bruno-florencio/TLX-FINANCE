import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Check,
  Download,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type SortField = 'cliente' | 'data_emissao' | 'categoria' | 'data_vencimento' | 'data_pagamento' | 'valor' | 'status';
type SortDirection = 'asc' | 'desc';

const EntradasTabEnhanced = () => {
  const { toast } = useToast();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [receiveDate, setReceiveDate] = useState<Date | undefined>(new Date());
  
  // Form states
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    conta_id: '',
    centro_custo_id: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Hooks para dados
  const { lancamentos, loading, createLancamento, markAsPaid, deleteLancamento } = useLancamentos('entrada');
  const { categorias, contas, centrosCusto } = useSupabaseData();

  // Função para alternar ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para obter o ícone de ordenação
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Ordenar lançamentos
  const sortedLancamentos = useMemo(() => {
    if (!sortField) return lancamentos;
    
    const sorted = [...lancamentos].sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];
      
      // Tratamento especial para campos específicos
      switch (sortField) {
        case 'cliente':
          aVal = a.descricao || '';
          bVal = b.descricao || '';
          break;
        case 'data_emissao':
          aVal = a.data_lancamento || '';
          bVal = b.data_lancamento || '';
          break;
        case 'categoria':
          const catA = categorias.find(cat => cat.id === a.categoria_id);
          const catB = categorias.find(cat => cat.id === b.categoria_id);
          aVal = catA?.nome || '';
          bVal = catB?.nome || '';
          break;
        case 'data_vencimento':
          aVal = a.data_vencimento || '';
          bVal = b.data_vencimento || '';
          break;
        case 'valor':
          aVal = a.valor || 0;
          bVal = b.valor || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
      }
      
      // Comparação
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [lancamentos, sortField, sortDirection, categorias]);

  const totalEntradas = sortedLancamentos.reduce((acc, entrada) => acc + entrada.valor, 0);
  const entradasPendentes = sortedLancamentos.filter(e => e.status === "pendente");
  const totalPendentes = entradasPendentes.reduce((acc, entrada) => acc + entrada.valor, 0);
  const entradasAtrasadas = sortedLancamentos.filter(e => 
    e.status === "pendente" && 
    e.data_vencimento && 
    new Date(e.data_vencimento) < new Date()
  );
  const totalAtrasados = entradasAtrasadas.reduce((acc, entrada) => acc + entrada.valor, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-500/20 text-green-500 border border-green-500/30">Pago</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">Pendente</Badge>;
      case "atrasado":
        return <Badge className="bg-red-500/20 text-red-500 border border-red-500/30">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid(id);
  };

  const handleEdit = (entrada: any) => {
    toast({
      title: "Editar Entrada",
      description: `Funcionalidade de edição para: ${entrada.descricao}`,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteLancamento(id);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = sortedLancamentos
        .filter(e => e.status === "pendente")
        .map(e => e.id);
      setSelectedItems(pendingIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handleReceiveSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um lançamento para receber.",
        variant: "destructive"
      });
      return;
    }

    if (!receiveDate) {
      toast({
        title: "Atenção",
        description: "Selecione uma data de recebimento.",
        variant: "destructive"
      });
      return;
    }

    // Marcar todos os itens selecionados como pagos com a data selecionada
    for (const id of selectedItems) {
      const { error } = await supabase
        .from('lancamentos')
        .update({ 
          status: 'pago',
          data_pagamento: format(receiveDate, 'yyyy-MM-dd')
        })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: `Erro ao marcar lançamento como pago: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    toast({
      title: "Recebimento Registrado",
      description: `${selectedItems.length} lançamento(s) marcado(s) como pago(s) com data ${format(receiveDate, 'dd/MM/yyyy')}.`,
    });
    
    setSelectedItems([]);
    setReceiveDialogOpen(false);
    setReceiveDate(new Date());
    window.location.reload(); // Recarregar para atualizar a lista
  };

  const handleAddLancamento = async () => {
    if (!formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newLancamento = {
      tipo: 'entrada' as const,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data_lancamento: formData.data_lancamento,
      categoria_id: formData.categoria_id || undefined,
      conta_id: formData.conta_id || undefined,
      centro_custo_id: formData.centro_custo_id || undefined,
      observacoes: formData.observacoes || undefined,
    };

    const result = await createLancamento(newLancamento);
    if (result) {
      setAddDialogOpen(false);
      setFormData({
        descricao: '',
        valor: '',
        categoria_id: '',
        conta_id: '',
        centro_custo_id: '',
        data_lancamento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
    }
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Status'];
    const data = sortedLancamentos.map(e => [
      formatDate(e.data_lancamento),
      e.descricao,
      formatCurrency(e.valor),
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
    const headers = ['Data', 'Descrição', 'Valor', 'Status'];
    const data = sortedLancamentos.map(e => [
      formatDate(e.data_lancamento),
      e.descricao,
      formatCurrency(e.valor),
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
                <p className="text-2xl font-bold text-pendente">{formatCurrency(totalPendentes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-atrasado" />
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-atrasado">{formatCurrency(totalAtrasados)}</p>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={selectedItems.length === 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Receber ({selectedItems.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Recebimento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Você está prestes a marcar {selectedItems.length} lançamento(s) como recebido(s).
                    </p>
                    <div className="space-y-2">
                      <Label>Data de Recebimento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !receiveDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {receiveDate ? format(receiveDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={receiveDate}
                            onSelect={setReceiveDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleReceiveSelected} disabled={!receiveDate}>
                      Confirmar Recebimento
                    </Button>
                  </DialogFooter>
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
                        <Input 
                          id="descricao" 
                          value={formData.descricao}
                          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Descrição da entrada" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor">Valor</Label>
                        <Input 
                          id="valor" 
                          type="number" 
                          step="0.01"
                          value={formData.valor}
                          onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                          placeholder="0,00" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select value={formData.categoria_id} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.filter(cat => cat.tipo === 'entrada').map(categoria => (
                              <SelectItem key={categoria.id} value={categoria.id}>
                                {categoria.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="centroCusto">Centro de Custo</Label>
                        <Select value={formData.centro_custo_id} onValueChange={(value) => setFormData(prev => ({ ...prev, centro_custo_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar centro de custo" />
                          </SelectTrigger>
                          <SelectContent>
                            {centrosCusto.map(centro => (
                              <SelectItem key={centro.id} value={centro.id}>
                                {centro.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="conta">Conta</Label>
                        <Select value={formData.conta_id} onValueChange={(value) => setFormData(prev => ({ ...prev, conta_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                          <SelectContent>
                            {contas.map(conta => (
                              <SelectItem key={conta.id} value={conta.id}>
                                {conta.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data">Data</Label>
                        <Input 
                          id="data" 
                          type="date" 
                          value={formData.data_lancamento}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Input 
                        id="observacoes" 
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Observações (opcional)" 
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddLancamento}>
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
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              {sortedLancamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma entrada encontrada
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-12 px-4 py-3">
                        <Checkbox 
                          checked={selectedItems.length === sortedLancamentos.filter(e => e.status === "pendente").length && sortedLancamentos.filter(e => e.status === "pendente").length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('cliente')}
                      >
                        <div className="flex items-center">
                          Cliente
                          {getSortIcon('cliente')}
                        </div>
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('data_emissao')}
                      >
                        <div className="flex items-center">
                          Data de Emissão
                          {getSortIcon('data_emissao')}
                        </div>
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('categoria')}
                      >
                        <div className="flex items-center">
                          Categoria
                          {getSortIcon('categoria')}
                        </div>
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('data_vencimento')}
                      >
                        <div className="flex items-center">
                          Data Vencimento
                          {getSortIcon('data_vencimento')}
                        </div>
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('data_pagamento')}
                      >
                        <div className="flex items-center">
                          Data Recebimento
                          {getSortIcon('data_pagamento')}
                        </div>
                      </th>
                      <th 
                        className="text-right px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('valor')}
                      >
                        <div className="flex items-center justify-end">
                          Valor
                          {getSortIcon('valor')}
                        </div>
                      </th>
                      <th 
                        className="text-center px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLancamentos.map((entrada) => {
                      const categoria = categorias.find(cat => cat.id === entrada.categoria_id);
                      const isAtrasado = entrada.status === 'pendente' && 
                                       entrada.data_vencimento && 
                                       new Date(entrada.data_vencimento) < new Date();
                      
                      return (
                        <tr 
                          key={entrada.id} 
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="w-12 px-4 py-3">
                            <Checkbox 
                              checked={selectedItems.includes(entrada.id)}
                              onCheckedChange={(checked) => handleSelectItem(entrada.id, checked as boolean)}
                              disabled={entrada.status === "pago"}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">{entrada.descricao}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(entrada.data_lancamento)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {categoria?.nome || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {entrada.data_vencimento ? formatDate(entrada.data_vencimento) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {entrada.data_pagamento ? formatDate(entrada.data_pagamento) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-entrada">
                            {formatCurrency(entrada.valor)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(isAtrasado ? 'atrasado' : entrada.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center space-x-1">
                              {entrada.status !== "pago" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMarkAsPaid(entrada.id)}
                                  title="Marcar como pago"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(entrada)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(entrada.id)}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntradasTabEnhanced;