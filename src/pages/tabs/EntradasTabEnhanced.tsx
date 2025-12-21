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
  CalendarIcon,
  Filter,
  X
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import NovaEntradaSheet from "@/components/forms/NovaEntradaSheet";

type SortField = 'cliente' | 'data_emissao' | 'categoria' | 'data_vencimento' | 'data_pagamento' | 'valor' | 'status';
type SortDirection = 'asc' | 'desc';

const EntradasTabEnhanced = () => {
  const { toast } = useToast();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [receiveDate, setReceiveDate] = useState<Date | undefined>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    cliente: '',
    categoria: '',
    status: '',
    valorMin: '',
    valorMax: '',
    dataEmissaoInicio: undefined as Date | undefined,
    dataEmissaoFim: undefined as Date | undefined,
    dataVencimentoInicio: undefined as Date | undefined,
    dataVencimentoFim: undefined as Date | undefined,
    dataRecebimentoInicio: undefined as Date | undefined,
    dataRecebimentoFim: undefined as Date | undefined,
  });

  // Hooks para dados
  const { lancamentos, loading, refetch, markAsPaid, deleteLancamento } = useLancamentos('entrada');
  const { categorias } = useSupabaseData();

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

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      cliente: '',
      categoria: '',
      status: '',
      valorMin: '',
      valorMax: '',
      dataEmissaoInicio: undefined,
      dataEmissaoFim: undefined,
      dataVencimentoInicio: undefined,
      dataVencimentoFim: undefined,
      dataRecebimentoInicio: undefined,
      dataRecebimentoFim: undefined,
    });
  };

  // Filtrar lançamentos
  const filteredLancamentos = useMemo(() => {
    let filtered = [...lancamentos];

    // Filtro por cliente
    if (filters.cliente) {
      filtered = filtered.filter(l => 
        l.descricao?.toLowerCase().includes(filters.cliente.toLowerCase())
      );
    }

    // Filtro por categoria
    if (filters.categoria) {
      filtered = filtered.filter(l => l.categoria_id === filters.categoria);
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(l => l.status === filters.status);
    }

    // Filtro por valor mínimo
    if (filters.valorMin) {
      const min = parseFloat(filters.valorMin);
      filtered = filtered.filter(l => l.valor >= min);
    }

    // Filtro por valor máximo
    if (filters.valorMax) {
      const max = parseFloat(filters.valorMax);
      filtered = filtered.filter(l => l.valor <= max);
    }

    // Filtro por data de emissão (usando data_vencimento)
    if (filters.dataEmissaoInicio) {
      filtered = filtered.filter(l => 
        l.data_vencimento && new Date(l.data_vencimento) >= filters.dataEmissaoInicio
      );
    }
    if (filters.dataEmissaoFim) {
      filtered = filtered.filter(l => 
        l.data_vencimento && new Date(l.data_vencimento) <= filters.dataEmissaoFim
      );
    }

    // Filtro por data de vencimento
    if (filters.dataVencimentoInicio) {
      filtered = filtered.filter(l => 
        l.data_vencimento && new Date(l.data_vencimento) >= filters.dataVencimentoInicio
      );
    }
    if (filters.dataVencimentoFim) {
      filtered = filtered.filter(l => 
        l.data_vencimento && new Date(l.data_vencimento) <= filters.dataVencimentoFim
      );
    }

    // Filtro por data de recebimento
    if (filters.dataRecebimentoInicio) {
      filtered = filtered.filter(l => 
        l.data_pagamento && new Date(l.data_pagamento) >= filters.dataRecebimentoInicio
      );
    }
    if (filters.dataRecebimentoFim) {
      filtered = filtered.filter(l => 
        l.data_pagamento && new Date(l.data_pagamento) <= filters.dataRecebimentoFim
      );
    }

    return filtered;
  }, [lancamentos, filters]);

  // Ordenar lançamentos filtrados
  const sortedLancamentos = useMemo(() => {
    if (!sortField) return filteredLancamentos;
    
    const sorted = [...filteredLancamentos].sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];
      
      // Tratamento especial para campos específicos
      switch (sortField) {
        case 'cliente':
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
  }, [filteredLancamentos, sortField, sortDirection, categorias]);

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
    setEditingLancamento(entrada);
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

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Status'];
    const data = sortedLancamentos.map(e => [
      formatDate(e.data_vencimento),
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
      formatDate(e.data_vencimento),
      e.descricao,
      formatCurrency(e.valor),
      e.status
    ]);

    exportToPDF({
      headers,
      data,
      title: 'Relatório de Entradas - TECHLABX',
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
          Controle completo de recebimentos do sistema TECHLABX
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {Object.values(filters).some(f => f && f !== '') && (
                  <Badge className="ml-2" variant="secondary">
                    {Object.values(filters).filter(f => f && f !== '').length}
                  </Badge>
                )}
              </Button>
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

              <Button size="sm" onClick={() => {
                setEditingLancamento(null);
                setAddDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>

              <NovaEntradaSheet 
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
          {/* Filtros */}
          {showFilters && (
            <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por Cliente */}
                <div>
                  <Label htmlFor="filter-cliente" className="text-xs">Cliente</Label>
                  <Input
                    id="filter-cliente"
                    placeholder="Buscar por cliente..."
                    value={filters.cliente}
                    onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                    className="h-9"
                  />
                </div>

                {/* Filtro por Categoria */}
                <div>
                  <Label htmlFor="filter-categoria" className="text-xs">Categoria</Label>
                  <Select 
                    value={filters.categoria} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {categorias.filter(cat => cat.tipo === 'entrada').map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Status */}
                <div>
                  <Label htmlFor="filter-status" className="text-xs">Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Valor */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="filter-valor-min" className="text-xs">Valor Mín</Label>
                    <Input
                      id="filter-valor-min"
                      type="number"
                      placeholder="0,00"
                      value={filters.valorMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, valorMin: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="filter-valor-max" className="text-xs">Valor Máx</Label>
                    <Input
                      id="filter-valor-max"
                      type="number"
                      placeholder="0,00"
                      value={filters.valorMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, valorMax: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Filtro por Data de Emissão */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs">Data Emissão - Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataEmissaoInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataEmissaoInicio ? format(filters.dataEmissaoInicio, "dd/MM/yyyy") : "Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataEmissaoInicio}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataEmissaoInicio: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Data Emissão - Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataEmissaoFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataEmissaoFim ? format(filters.dataEmissaoFim, "dd/MM/yyyy") : "Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataEmissaoFim}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataEmissaoFim: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Filtro por Data de Vencimento */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs">Data Vencimento - Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataVencimentoInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataVencimentoInicio ? format(filters.dataVencimentoInicio, "dd/MM/yyyy") : "Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataVencimentoInicio}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataVencimentoInicio: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Data Vencimento - Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataVencimentoFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataVencimentoFim ? format(filters.dataVencimentoFim, "dd/MM/yyyy") : "Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataVencimentoFim}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataVencimentoFim: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Filtro por Data de Recebimento */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs">Data Recebimento - Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataRecebimentoInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataRecebimentoInicio ? format(filters.dataRecebimentoInicio, "dd/MM/yyyy") : "Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataRecebimentoInicio}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataRecebimentoInicio: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Data Recebimento - Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal",
                            !filters.dataRecebimentoFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {filters.dataRecebimentoFim ? format(filters.dataRecebimentoFim, "dd/MM/yyyy") : "Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dataRecebimentoFim}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dataRecebimentoFim: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Botão Limpar Filtros */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                            {formatDate(entrada.data_vencimento)}
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