import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore } from "date-fns";
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
  Banknote
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
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  conta_id: string | null;
  fornecedor_id: string | null;
  centro_custo_id: string | null;
  numero_documento: string | null;
  observacoes: string | null;
  recorrente: boolean;
  parcela_atual: number | null;
  total_parcelas: number | null;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Conta {
    id: string;
    nome: string;
    saldo_inicial: number;
    data_saldo_inicial: string | null;
}

const ExtratoTab = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dataInicial, setDataInicial] = useState<Date>(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date>(endOfMonth(new Date()));
  const [contaFilter, setContaFilter] = useState<string>("todas");
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
      const [lancamentosRes, categoriasRes, contasRes] = await Promise.all([
        supabase.from("lancamentos").select("*").order("data_vencimento", { ascending: false }),
        supabase.from("categorias").select("*"),
        supabase.from("contas_bancarias").select("id, nome, saldo_inicial, data_saldo_inicial"),
      ]);

      if (lancamentosRes.error) throw lancamentosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;
      if (contasRes.error) throw contasRes.error;

      setLancamentos((lancamentosRes.data || []) as unknown as Lancamento[]);
      setCategorias((categoriasRes.data || []) as unknown as Categoria[]);
      setContas((contasRes.data || []) as unknown as Conta[]);
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
      const lancamentoDate = parseISO(l.data_vencimento);
      const withinDateRange = isWithinInterval(lancamentoDate, {
        start: dataInicial,
        end: dataFinal,
      });

      const matchesConta = contaFilter === "todas" || l.conta_id === contaFilter;
      const matchesTipo = tipoFilter === "todos" || l.tipo === tipoFilter;
      const matchesStatus = statusFilter === "todos" || l.status === statusFilter;
      const matchesCategoria = categoriaFilter === "todos" || l.categoria_id === categoriaFilter;
      const matchesSearch =
        searchText === "" ||
        l.descricao.toLowerCase().includes(searchText.toLowerCase());

      return withinDateRange && matchesConta && matchesTipo && matchesStatus && matchesCategoria && matchesSearch;
    });
  }, [lancamentos, dataInicial, dataFinal, contaFilter, tipoFilter, statusFilter, categoriaFilter, searchText]);

  const lancamentosComSaldo = useMemo(() => {
    const contaSelecionada = contas.find(c => c.id === contaFilter);
    let saldoAnterior = 0;
    
    // Calcula o saldo anterior apenas se uma conta específica for selecionada
    if (contaSelecionada) {
        saldoAnterior = lancamentos
            .filter(l => l.conta_id === contaFilter && isBefore(parseISO(l.data_vencimento), dataInicial) && (l.status === 'pago' || l.status === 'recebido'))
            .reduce((acc, l) => acc + (l.tipo === 'entrada' ? l.valor : -l.valor), 0);
        
        // Adiciona o saldo inicial da conta se a data for anterior ao período
        if (contaSelecionada.data_saldo_inicial && isBefore(parseISO(contaSelecionada.data_saldo_inicial), dataInicial)) {
            saldoAnterior += contaSelecionada.saldo_inicial;
        }
    }

    const sortedAsc = [...filteredLancamentos].sort(
      (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
    );

    let saldoAcumulado = saldoAnterior;
    const withBalance = sortedAsc.map((l) => {
      if (l.status === "pago" || l.status === "recebido") {
          saldoAcumulado += (l.tipo === 'entrada' ? l.valor : -l.valor);
      }
      return { ...l, saldo: saldoAcumulado };
    });

    // Adiciona a linha do Saldo Inicial se a data estiver no período
    if (contaSelecionada && contaSelecionada.data_saldo_inicial && isWithinInterval(parseISO(contaSelecionada.data_saldo_inicial), { start: dataInicial, end: dataFinal })) {
        const saldoInicialLancamento: any = {
            id: 'saldo_inicial',
            descricao: 'Saldo Inicial',
            data_vencimento: contaSelecionada.data_saldo_inicial,
            valor: contaSelecionada.saldo_inicial,
            tipo: contaSelecionada.saldo_inicial >= 0 ? 'entrada' : 'saida',
            status: 'pago',
            saldo: saldoAnterior + contaSelecionada.saldo_inicial
        };
        withBalance.unshift(saldoInicialLancamento);
    }

    return withBalance.reverse();
  }, [filteredLancamentos, contaFilter, contas, dataInicial]);

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
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
        return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch(e) { return "-"}
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago": return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case "recebido": return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Recebido</Badge>;
      case "pendente": return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Receipt className="w-8 h-8 text-primary" />Extrato Bancário</h1>
          <p className="text-muted-foreground mt-1">Visualize todos os lançamentos em ordem cronológica</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2"><RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />Atualizar Extrato</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cards de Resumo */}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Filter className="w-5 h-5 text-primary" />Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Filtros de Data e outros */}
            <div className="space-y-2 lg:col-span-2">
                <Label className="text-sm text-muted-foreground">Conta</Label>
                <Select value={contaFilter} onValueChange={setContaFilter}>
                    <SelectTrigger><SelectValue placeholder="Todas as Contas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas as Contas</SelectItem>
                        {contas.map((conta) => (<SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border"><CardTitle className="text-lg">Extrato do Período</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosComSaldo.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum lançamento encontrado.</p></TableCell></TableRow>
                ) : (
                  lancamentosComSaldo.map((lancamento, index) => {
                    const isEntrada = lancamento.tipo === 'entrada';
                    const isPendente = lancamento.status === 'pendente';
                    return (
                        <TableRow key={lancamento.id}>
                          <TableCell>{formatDate(lancamento.data_vencimento)}</TableCell>
                          <TableCell>{lancamento.descricao}</TableCell>
                          <TableCell>{getCategoriaName(lancamento.categoria_id)}</TableCell>
                          <TableCell className="text-center">{isEntrada ? <ArrowUpCircle className="text-green-400"/> : <ArrowDownCircle className="text-red-400"/>}</TableCell>
                          <TableCell className={`text-right font-bold ${isEntrada ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(lancamento.valor)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(lancamento.saldo)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(lancamento.status)}</TableCell>
                          <TableCell className="text-center">
                          {lancamento.id !== 'saldo_inicial' &&
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(lancamento)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                                {isPendente && <DropdownMenuItem onClick={() => { setLancamentoToMark(lancamento); setMarkPaidDialogOpen(true); }}><CheckCircle className="w-4 h-4 mr-2" />Marcar como Pago/Recebido</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => { setLancamentoToDelete(lancamento); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          }
                          </TableCell>
                        </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sheets e Dialogs */}
      <NovaEntradaSheet open={editEntradaOpen} onOpenChange={setEditEntradaOpen} onSuccess={() => { fetchData(); setEditingLancamento(null); }} editingLancamento={editingLancamento}/>
      <NovaContaPagarSheet open={editSaidaOpen} onOpenChange={setEditSaidaOpen} onSuccess={() => { fetchData(); setEditingLancamento(null); }} editingLancamento={editingLancamento}/>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o lançamento "{lancamentoToDelete?.descricao}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle><AlertDialogDescription>Deseja marcar este lançamento como <strong>{lancamentoToMark?.tipo === "entrada" ? "RECEBIDO" : "PAGO"}</strong>?</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleMarkAsPaid}>Confirmar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExtratoTab;
