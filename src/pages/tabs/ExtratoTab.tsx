import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  CalendarIcon,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NovaEntradaSheet from "@/components/forms/NovaEntradaSheet";
import NovaContaPagarSheet from "@/components/forms/NovaContaPagarSheet";

interface Lancamento {
  id: string;
  tipo: string;
  descricao: string;
  categoria_id: string | null;
  valor: number;
  data_lancamento: string;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: string;
  conta_id: string | null;
  fornecedor_id: string | null;
  centro_custo_id: string | null;
  observacoes: string | null;
  documento: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

const ExtratoTab = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dataInicial, setDataInicial] = useState<Date>(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date>(endOfMonth(new Date()));
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todos");
  const [searchText, setSearchText] = useState("");

  // Edit/Delete states
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [editEntradaOpen, setEditEntradaOpen] = useState(false);
  const [editSaidaOpen, setEditSaidaOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lancamentoToDelete, setLancamentoToDelete] = useState<Lancamento | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [lancamentoToMark, setLancamentoToMark] = useState<Lancamento | null>(null);

  const fetchData = async () => {
    try {
      const [lancamentosRes, categoriasRes] = await Promise.all([
        supabase.from("lancamentos").select("*").order("data_lancamento", { ascending: false }),
        supabase.from("categorias").select("*").eq("ativo", true),
      ]);

      if (lancamentosRes.error) throw lancamentosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;

      setLancamentos(lancamentosRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do extrato");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Extrato atualizado!");
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter lancamentos
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter((l) => {
      const lancamentoDate = parseISO(l.data_lancamento);
      const withinDateRange = isWithinInterval(lancamentoDate, {
        start: dataInicial,
        end: dataFinal,
      });

      const matchesTipo = tipoFilter === "todos" || l.tipo === tipoFilter;
      const matchesStatus = statusFilter === "todos" || l.status === statusFilter;
      const matchesCategoria = categoriaFilter === "todos" || l.categoria_id === categoriaFilter;
      const matchesSearch =
        searchText === "" ||
        l.descricao.toLowerCase().includes(searchText.toLowerCase());

      return withinDateRange && matchesTipo && matchesStatus && matchesCategoria && matchesSearch;
    });
  }, [lancamentos, dataInicial, dataFinal, tipoFilter, statusFilter, categoriaFilter, searchText]);

  // Sort by date (most recent first) and calculate running balance
  const lancamentosComSaldo = useMemo(() => {
    // Sort by date ascending for balance calculation
    const sortedAsc = [...filteredLancamentos].sort(
      (a, b) => new Date(a.data_lancamento).getTime() - new Date(b.data_lancamento).getTime()
    );

    let saldoAcumulado = 0;
    const withBalance = sortedAsc.map((l) => {
      // Only paid/received entries affect balance
      if (l.status === "pago" || l.status === "recebido") {
        if (l.tipo === "entrada") {
          saldoAcumulado += l.valor;
        } else {
          saldoAcumulado -= l.valor;
        }
      }
      return { ...l, saldo: saldoAcumulado };
    });

    // Return in reverse order (most recent first)
    return withBalance.reverse();
  }, [filteredLancamentos]);

  // Summary calculations
  const summary = useMemo(() => {
    const entradas = filteredLancamentos
      .filter((l) => l.tipo === "entrada" && (l.status === "pago" || l.status === "recebido"))
      .reduce((sum, l) => sum + l.valor, 0);
    const saidas = filteredLancamentos
      .filter((l) => l.tipo === "saida" && (l.status === "pago" || l.status === "recebido"))
      .reduce((sum, l) => sum + l.valor, 0);
    const pendentes = filteredLancamentos.filter((l) => l.status === "pendente").length;
    return { entradas, saidas, saldo: entradas - saidas, pendentes };
  }, [filteredLancamentos]);

  const getCategoriaName = (id: string | null) => {
    if (!id) return "-";
    const categoria = categorias.find((c) => c.id === id);
    return categoria?.nome || "-";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleDelete = async () => {
    if (!lancamentoToDelete) return;
    try {
      const { error } = await supabase.from("lancamentos").delete().eq("id", lancamentoToDelete.id);
      if (error) throw error;
      toast.success("Lançamento excluído com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir lançamento");
    } finally {
      setDeleteDialogOpen(false);
      setLancamentoToDelete(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!lancamentoToMark) return;
    try {
      const newStatus = lancamentoToMark.tipo === "entrada" ? "recebido" : "pago";
      const { error } = await supabase
        .from("lancamentos")
        .update({ status: newStatus, data_pagamento: new Date().toISOString().split("T")[0] })
        .eq("id", lancamentoToMark.id);
      if (error) throw error;
      toast.success(`Lançamento marcado como ${newStatus.toUpperCase()}!`);
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setMarkPaidDialogOpen(false);
      setLancamentoToMark(null);
    }
  };

  const handleEdit = (lancamento: Lancamento) => {
    setEditingLancamento(lancamento);
    if (lancamento.tipo === "entrada") {
      setEditEntradaOpen(true);
    } else {
      setEditSaidaOpen(true);
    }
  };

  const getStatusBadge = (status: string, tipo: string) => {
    switch (status) {
      case "pago":
        return (
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case "recebido":
        return (
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recebido
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Group by date for visual separation
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: typeof lancamentosComSaldo } = {};
    lancamentosComSaldo.forEach((l) => {
      const date = l.data_lancamento;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(l);
    });
    return groups;
  }, [lancamentosComSaldo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" />
            Extrato Bancário
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os lançamentos em ordem cronológica
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Atualizar Extrato
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.entradas)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.saidas)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              Saldo do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-bold", summary.saldo >= 0 ? "text-green-400" : "text-red-400")}>
              {formatCurrency(summary.saldo)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{summary.pendentes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Data Inicial */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicial && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicial ? format(dataInicial, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicial}
                    onSelect={(date) => date && setDataInicial(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFinal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFinal ? format(dataFinal, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFinal}
                    onSelect={(date) => date && setDataFinal(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Categoria</Label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar descrição..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statement Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg">
            Extrato do Período: {format(dataInicial, "dd/MM/yyyy", { locale: ptBR })} a{" "}
            {format(dataFinal, "dd/MM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold text-center">Tipo</TableHead>
                  <TableHead className="font-semibold text-right">Valor</TableHead>
                  <TableHead className="font-semibold text-right">Saldo</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosComSaldo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum lançamento encontrado no período selecionado.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  lancamentosComSaldo.map((lancamento, index) => {
                    const isEntrada = lancamento.tipo === "entrada";
                    const isPendente = lancamento.status === "pendente";
                    const showDateSeparator =
                      index === 0 ||
                      lancamento.data_lancamento !== lancamentosComSaldo[index - 1].data_lancamento;

                    return (
                      <>
                        {showDateSeparator && (
                          <TableRow key={`sep-${lancamento.id}`} className="bg-muted/20">
                            <TableCell
                              colSpan={8}
                              className="py-2 px-4 text-sm font-semibold text-primary"
                            >
                              📅 {format(parseISO(lancamento.data_lancamento), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          key={lancamento.id}
                          className={cn(
                            "transition-colors duration-200",
                            index % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                            isPendente && "opacity-70",
                            "hover:bg-muted/30"
                          )}
                        >
                          <TableCell className="font-medium text-muted-foreground">
                            {formatDate(lancamento.data_lancamento)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={cn("font-medium", isPendente && "italic")}>
                                {lancamento.descricao}
                              </span>
                              {lancamento.documento && (
                                <span className="text-xs text-muted-foreground">
                                  Doc: {lancamento.documento}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getCategoriaName(lancamento.categoria_id)}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEntrada ? (
                              <div className="flex items-center justify-center gap-1 text-green-400">
                                <ArrowUpCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Entrada</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-red-400">
                                <ArrowDownCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Saída</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "font-bold",
                                isEntrada ? "text-green-400" : "text-red-400",
                                isPendente && "opacity-60"
                              )}
                            >
                              {isEntrada ? "+" : "-"} {formatCurrency(lancamento.valor)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "font-semibold",
                                lancamento.saldo >= 0 ? "text-green-400" : "text-red-400"
                              )}
                            >
                              {formatCurrency(lancamento.saldo)}
                            </span>
                            {isPendente && (
                              <span className="block text-xs text-muted-foreground italic">
                                (não afeta saldo)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(lancamento.status, lancamento.tipo)}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(lancamento)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {lancamento.status === "pendente" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLancamentoToMark(lancamento);
                                      setMarkPaidDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marcar como {isEntrada ? "Recebido" : "Pago"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-400 focus:text-red-400"
                                  onClick={() => {
                                    setLancamentoToDelete(lancamento);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Entrada Sheet */}
      <NovaEntradaSheet
        open={editEntradaOpen}
        onOpenChange={setEditEntradaOpen}
        onSuccess={() => {
          fetchData();
          setEditingLancamento(null);
        }}
        editingLancamento={editingLancamento}
      />

      {/* Edit Saída Sheet */}
      <NovaContaPagarSheet
        open={editSaidaOpen}
        onOpenChange={setEditSaidaOpen}
        onSuccess={() => {
          fetchData();
          setEditingLancamento(null);
        }}
        editingLancamento={editingLancamento}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lançamento "{lancamentoToDelete?.descricao}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid Dialog */}
      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar este lançamento como{" "}
              <strong>{lancamentoToMark?.tipo === "entrada" ? "RECEBIDO" : "PAGO"}</strong>?
              <br />
              <br />
              <span className="text-muted-foreground">
                Lançamento: {lancamentoToMark?.descricao}
                <br />
                Valor: {lancamentoToMark && formatCurrency(lancamentoToMark.valor)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExtratoTab;
