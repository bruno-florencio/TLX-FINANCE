import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TrendingDown, 
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
  CalendarIcon,
  Building2
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import NovaContaPagarSheet from "@/components/forms/NovaContaPagarSheet";
import { LancamentosFilterModal, LancamentosFilters, useFilteredLancamentos } from "@/components/filters/LancamentosFilterModal";

type SortField = 'fornecedor' | 'data_emissao' | 'categoria' | 'centro_custo' | 'data_vencimento' | 'data_pagamento' | 'valor' | 'status';
type SortDirection = 'asc' | 'desc';

const SaidasTabEnhanced = () => {
  const { toast } = useToast();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [payDate, setPayDate] = useState<Date | undefined>(new Date());
  
  // Estado para filtros
  const [filters, setFilters] = useState<LancamentosFilters>({
    dataInicio: undefined,
    dataFim: undefined,
    status: '',
    categoria: '',
    centroCusto: '',
    fornecedorCliente: '',
    valorMin: '',
    valorMax: '',
    descricao: '',
  });

  // Hooks para dados
  const { lancamentos, loading, refetch, markAsPaid, deleteLancamento } = useLancamentos('saida');
  const { categorias, centrosCusto, fornecedores, clientes } = useSupabaseData();

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

  // Filtrar lançamentos usando o hook
  const filteredLancamentos = useFilteredLancamentos(lancamentos, filters);

  // Ordenar lançamentos filtrados
  const sortedLancamentos = useMemo(() => {
    if (!sortField) return filteredLancamentos;
    
    const sorted = [...filteredLancamentos].sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];
      
      // Tratamento especial para campos específicos
      switch (sortField) {
        case 'fornecedor':
          aVal = a.descricao || '';
          bVal = b.descricao || '';
          break;
        case 'data_emissao':
          aVal = a.data_vencimento || '';
          bVal = b.data_vencimento || '';
          break;
        case 'categoria':
          const catA = categorias.find(cat => cat.id === a.categoria_id);
          const catB = categorias.find(cat => cat.id === b.categoria_id);
          aVal = catA?.nome || '';
          bVal = catB?.nome || '';
          break;
        case 'centro_custo':
          const ccA = centrosCusto.find(cc => cc.id === a.centro_custo_id);
          const ccB = centrosCusto.find(cc => cc.id === b.centro_custo_id);
          aVal = ccA?.nome || '';
          bVal = ccB?.nome || '';
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
  }, [filteredLancamentos, sortField, sortDirection, categorias, centrosCusto]);

  // Totais baseados nos dados filtrados
  const totalSaidas = sortedLancamentos.reduce((acc, saida) => acc + saida.valor, 0);
  const saidasPendentes = sortedLancamentos.filter(s => s.status === "pendente");
  const totalPendentes = saidasPendentes.reduce((acc, saida) => acc + saida.valor, 0);
  const saidasPagas = sortedLancamentos.filter(s => s.status === "pago");
  const totalPagos = saidasPagas.reduce((acc, saida) => acc + saida.valor, 0);

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

  const handleEdit = (saida: any) => {
    setEditingLancamento(saida);
    setAddDialogOpen(true);
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
        .filter(s => s.status === "pendente")
        .map(s => s.id);
      setSelectedItems(pendingIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handlePaySelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um lançamento para pagar.",
        variant: "destructive"
      });
      return;
    }

    if (!payDate) {
      toast({
        title: "Atenção",
        description: "Selecione uma data de pagamento.",
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
          data_pagamento: format(payDate, 'yyyy-MM-dd')
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
      title: "Pagamento Registrado",
      description: `${selectedItems.length} lançamento(s) marcado(s) como pago(s) com data ${format(payDate, 'dd/MM/yyyy')}.`,
    });
    
    setSelectedItems([]);
    setPayDialogOpen(false);
    setPayDate(new Date());
    refetch();
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Centro Custo', 'Fornecedor', 'Valor', 'Status'];
    const data = sortedLancamentos.map(s => {
      const categoria = categorias.find(cat => cat.id === s.categoria_id);
      const centroCusto = centrosCusto.find(cc => cc.id === s.centro_custo_id);
      const fornecedor = fornecedores.find(f => f.id === s.fornecedor_id);
      return [
        formatDate(s.data_vencimento),
        s.descricao,
        categoria?.nome || '-',
        centroCusto?.nome || '-',
        fornecedor?.nome || '-',
        formatCurrency(s.valor),
        s.status
      ];
    });

    exportToExcel({
      headers,
      data,
      title: 'Relatório de Saídas',
      filename: 'saidas_financeiras'
    });
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Centro Custo', 'Fornecedor', 'Valor', 'Status'];
    const data = sortedLancamentos.map(s => {
      const categoria = categorias.find(cat => cat.id === s.categoria_id);
      const centroCusto = centrosCusto.find(cc => cc.id === s.centro_custo_id);
      const fornecedor = fornecedores.find(f => f.id === s.fornecedor_id);
      return [
        formatDate(s.data_vencimento),
        s.descricao,
        categoria?.nome || '-',
        centroCusto?.nome || '-',
        fornecedor?.nome || '-',
        formatCurrency(s.valor),
        s.status
      ];
    });

    exportToPDF({
      headers,
      data,
      title: 'Relatório de Saídas - TECHLABX',
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
          Controle completo de pagamentos do sistema TECHLABX
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
                <p className="text-2xl font-bold text-pendente">{formatCurrency(totalPendentes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalPagos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações e Listagem */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5" />
              <span>Lançamentos de Saída</span>
              <Badge variant="secondary">{sortedLancamentos.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <LancamentosFilterModal
                tipo="saida"
                filters={filters}
                onFiltersChange={setFilters}
                categorias={categorias}
                centrosCusto={centrosCusto}
                fornecedores={fornecedores}
                clientes={clientes}
              />
              
              <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={selectedItems.length === 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Pagar ({selectedItems.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Pagamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Você está prestes a marcar {selectedItems.length} lançamento(s) como pago(s).
                    </p>
                    <div className="space-y-2">
                      <Label>Data de Pagamento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !payDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {payDate ? format(payDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={payDate}
                            onSelect={setPayDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handlePaySelected} disabled={!payDate}>
                      Confirmar Pagamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="sm" onClick={() => {
                setEditingLancamento(null);
                setAddDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Saída
              </Button>

              <NovaContaPagarSheet 
                open={addDialogOpen} 
                onOpenChange={(open) => {
                  setAddDialogOpen(open);
                  if (!open) setEditingLancamento(null);
                }}
                onSuccess={refetch}
                editingLancamento={editingLancamento}
              />

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
                  Nenhuma saída encontrada
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-12 px-4 py-3">
                        <Checkbox 
                          checked={selectedItems.length === sortedLancamentos.filter(s => s.status === "pendente").length && sortedLancamentos.filter(s => s.status === "pendente").length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('fornecedor')}
                      >
                        <div className="flex items-center">
                          Descrição
                          {getSortIcon('fornecedor')}
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
                        onClick={() => handleSort('centro_custo')}
                      >
                        <div className="flex items-center">
                          Centro Custo
                          {getSortIcon('centro_custo')}
                        </div>
                      </th>
                      <th 
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort('data_vencimento')}
                      >
                        <div className="flex items-center">
                          Vencimento
                          {getSortIcon('data_vencimento')}
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
                    {sortedLancamentos.map((saida) => {
                      const categoria = categorias.find(cat => cat.id === saida.categoria_id);
                      const centroCusto = centrosCusto.find(cc => cc.id === saida.centro_custo_id);
                      const fornecedor = fornecedores.find(f => f.id === saida.fornecedor_id);
                      const isAtrasado = saida.status === 'pendente' && 
                                       saida.data_vencimento && 
                                       new Date(saida.data_vencimento) < new Date();
                      
                      return (
                        <tr 
                          key={saida.id} 
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="w-12 px-4 py-3">
                            <Checkbox 
                              checked={selectedItems.includes(saida.id)}
                              onCheckedChange={(checked) => handleSelectItem(saida.id, checked as boolean)}
                              disabled={saida.status === "pago"}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{saida.descricao}</span>
                              {fornecedor && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {fornecedor.nome}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {categoria?.nome || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {centroCusto?.nome || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {saida.data_vencimento ? formatDate(saida.data_vencimento) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-saida">
                            {formatCurrency(saida.valor)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(isAtrasado ? 'atrasado' : saida.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center space-x-1">
                              {saida.status !== "pago" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMarkAsPaid(saida.id)}
                                  title="Marcar como pago"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(saida)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(saida.id)}
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

export default SaidasTabEnhanced;
