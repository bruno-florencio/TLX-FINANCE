import { useState, useEffect } from "react";
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
  Download, 
  Edit, 
  Trash2,
  Calculator,
  CreditCard,
  RefreshCw
} from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BankLogo } from "@/components/ui/BankLogo";

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string | null;
  tipo: string;
  saldo_atual: number;
  saldo_inicial: number;
  ativo: boolean;
}

interface ExtratoBancario {
  id: string;
  data: string;
  descricao: string | null;
  valor: number;
  conta_id: string | null;
  conciliado: boolean | null;
}

const ContasTab = () => {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState("todos");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [extratos, setExtratos] = useState<ExtratoBancario[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer form state
  const [contaOrigem, setContaOrigem] = useState("");
  const [contaDestino, setContaDestino] = useState("");
  const [valorTransfer, setValorTransfer] = useState("");
  const [descricaoTransfer, setDescricaoTransfer] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [contasRes, extratosRes] = await Promise.all([
        supabase
          .from("contas_bancarias")
          .select("*")
          .eq("ativo", true)
          .neq("tipo", "cartao_credito")
          .order("nome"),
        supabase
          .from("extratos_bancarios")
          .select("*")
          .order("data", { ascending: false })
          .limit(50)
      ]);

      if (contasRes.error) throw contasRes.error;
      if (extratosRes.error) throw extratosRes.error;

      setContas(contasRes.data || []);
      setExtratos(extratosRes.data || []);
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das contas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSaldo = contas.reduce((acc, conta) => acc + Number(conta.saldo_atual), 0);

  const filteredExtratos = selectedAccount === "todos" 
    ? extratos 
    : extratos.filter(e => e.conta_id === selectedAccount);

  const getAccountIcon = (tipo: string) => {
    switch (tipo) {
      case "corrente": return <CreditCard className="w-4 h-4" />;
      case "poupanca": return <Banknote className="w-4 h-4" />;
      case "investimento": return <Calculator className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (conciliado: boolean | null) => {
    if (conciliado) {
      return <Badge className="pago-indicator">Conciliado</Badge>;
    }
    return <Badge className="pendente-indicator">Pendente</Badge>;
  };

  const getContaNome = (contaId: string | null) => {
    if (!contaId) return "—";
    const conta = contas.find(c => c.id === contaId);
    return conta?.nome || "—";
  };

  const handleTransfer = async () => {
    if (!contaOrigem || !contaDestino || !valorTransfer) {
      toast({
        title: "Atenção",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (contaOrigem === contaDestino) {
      toast({
        title: "Atenção",
        description: "Conta de origem e destino devem ser diferentes.",
        variant: "destructive"
      });
      return;
    }

    try {
      const valor = parseFloat(valorTransfer);
      
      const { error } = await supabase.from("transferencias").insert({
        conta_origem_id: contaOrigem,
        conta_destino_id: contaDestino,
        valor,
        descricao: descricaoTransfer || "Transferência entre contas"
      });

      if (error) throw error;

      toast({
        title: "Transferência realizada",
        description: `Valor de ${formatCurrency(valor)} transferido com sucesso.`
      });

      setTransferDialogOpen(false);
      setContaOrigem("");
      setContaDestino("");
      setValorTransfer("");
      setDescricaoTransfer("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar transferência.",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Conta', 'Status'];
    const data = filteredExtratos.map(e => [
      formatDate(e.data),
      e.descricao || "",
      formatCurrency(e.valor),
      getContaNome(e.conta_id),
      e.conciliado ? "Conciliado" : "Pendente"
    ]);

    exportToExcel({
      headers,
      data,
      title: 'Extratos Bancários',
      filename: 'extratos_bancarios'
    });
  };

  const handleExportPDF = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Conta', 'Status'];
    const data = filteredExtratos.map(e => [
      formatDate(e.data),
      e.descricao || "",
      formatCurrency(e.valor),
      getContaNome(e.conta_id),
      e.conciliado ? "Conciliado" : "Pendente"
    ]);

    exportToPDF({
      headers,
      data,
      title: 'Extratos Bancários',
      filename: 'extratos_bancarios'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-american-captain text-foreground">
            Contas e Extratos
          </h1>
          <p className="text-muted-foreground">
            Gestão e conciliação bancária
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo das Contas */}
      {contas.length === 0 ? (
        <Card className="h-molina-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta bancária cadastrada</p>
            <p className="text-sm">Vá em Configurações para adicionar contas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contas.map((conta) => (
            <Card key={conta.id} className="h-molina-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BankLogo bankName={conta.banco || conta.nome} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{conta.nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{conta.tipo}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`text-2xl font-bold ${conta.saldo_atual >= 0 ? 'text-entrada' : 'text-saida'}`}>
                    {formatCurrency(conta.saldo_atual)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Total Geral */}
      {contas.length > 0 && (
        <Card className="h-molina-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total Consolidado</p>
                <p className={`text-3xl font-bold ${totalSaldo >= 0 ? 'text-entrada' : 'text-saida'}`}>
                  {formatCurrency(totalSaldo)}
                </p>
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
                          <Select value={contaOrigem} onValueChange={setContaOrigem}>
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
                          <Label htmlFor="contaDestino">Conta de Destino</Label>
                          <Select value={contaDestino} onValueChange={setContaDestino}>
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
                      </div>
                      <div>
                        <Label htmlFor="valor">Valor</Label>
                        <Input 
                          id="valor" 
                          type="number" 
                          placeholder="0,00" 
                          value={valorTransfer}
                          onChange={(e) => setValorTransfer(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input 
                          id="descricao" 
                          placeholder="Descrição da transferência" 
                          value={descricaoTransfer}
                          onChange={(e) => setDescricaoTransfer(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleTransfer}>
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
      )}

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
                  {contas.map(conta => (
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
          {filteredExtratos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum extrato encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExtratos.map((extrato) => (
                <div 
                  key={extrato.id} 
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{extrato.descricao || "Sem descrição"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(extrato.data)} • {getContaNome(extrato.conta_id)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span 
                            className={`text-lg font-medium ${
                              extrato.valor >= 0 ? 'text-entrada' : 'text-saida'
                            }`}
                          >
                            {formatCurrency(extrato.valor)}
                          </span>
                          <div className="mt-1">
                            {getStatusBadge(extrato.conciliado)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContasTab;
