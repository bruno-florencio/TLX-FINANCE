import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Users, 
  Building, 
  CreditCard,
  Tags,
  Plus,
  Edit,
  Trash2,
  Target,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import NovaContaSheet from "@/components/forms/NovaContaSheet";
import { bancosUnicos } from "@/data/bancosBrasileiros";
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

const ConfiguracaoTab = () => {
  const { toast } = useToast();
  const { contas, categorias, centrosCusto, fornecedores, loading, refetch } = useSupabaseData();
  
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; nome: string } | null>(null);

  // Mock data para demonstração (fornecedores e clientes)
  const [clientes] = useState([
    { id: "1", nome: "Empresa Cliente A", cnpj: "44.555.666/0001-77", contato: "financeiro@clientea.com" },
    { id: "2", nome: "Cliente B Ltda", cnpj: "33.444.555/0001-88", contato: "pagamentos@clienteb.com" },
    { id: "3", nome: "Corporação C", cnpj: "22.333.444/0001-99", contato: "contas@corporacaoc.com" }
  ]);

  const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
  const categoriasSaida = categorias.filter(c => c.tipo === 'saida');

  const handleEdit = (type: string, item: any) => {
    if (type === "Conta") {
      setEditingConta(item);
      setNovaContaOpen(true);
    } else {
      toast({
        title: `Editar ${type}`,
        description: `Modal de edição será implementado para: ${item.nome || item.banco}`,
      });
    }
  };

  const handleDeleteClick = (type: string, id: string, nome: string) => {
    setItemToDelete({ type, id, nome });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      let tableName = "";
      switch (itemToDelete.type) {
        case "Conta":
          tableName = "contas";
          break;
        case "Categoria":
          tableName = "categorias";
          break;
        case "Centro de Custo":
          tableName = "centros_custo";
          break;
        case "Fornecedor":
          tableName = "fornecedores";
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from(tableName as any)
        .update({ ativo: false } as any)
        .eq("id", itemToDelete.id);

      if (error) throw error;

      toast({
        title: `${itemToDelete.type} Excluído`,
        description: `${itemToDelete.nome} foi removido com sucesso.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir item.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAdd = (type: string) => {
    if (type === "Conta Bancária") {
      setEditingConta(null);
      setNovaContaOpen(true);
    } else {
      toast({
        title: `Novo ${type}`,
        description: "Modal de cadastro será implementado.",
      });
    }
  };

  const getBancoInfo = (bancoNome: string) => {
    return bancosUnicos.find(b => b.nome === bancoNome);
  };

  const getTipoContaBadge = (tipo: string) => {
    switch (tipo) {
      case "corrente":
        return { label: "Corrente", variant: "default" as const };
      case "poupanca":
        return { label: "Poupança", variant: "secondary" as const };
      case "digital":
        return { label: "Digital", variant: "outline" as const };
      case "investimento":
        return { label: "Investimento", variant: "secondary" as const };
      case "cartao_credito":
        return { label: "Cartão de Crédito", variant: "destructive" as const };
      case "salario":
        return { label: "Salário", variant: "outline" as const };
      default:
        return { label: tipo, variant: "outline" as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-american-captain text-foreground">
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores, clientes, contas bancárias e categorias
          </p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Contas Bancárias e Cartões */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Contas Bancárias e Cartões de Crédito</span>
            </div>
            <Button onClick={() => handleAdd("Conta Bancária")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta / Cartão
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : contas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta cadastrada</p>
              <p className="text-sm">Clique em "Nova Conta / Cartão" para adicionar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contas.map((conta) => {
                const bancoInfo = getBancoInfo(conta.banco || "");
                const tipoBadge = getTipoContaBadge(conta.tipo);
                const isCartao = conta.tipo === "cartao_credito";
                
                return (
                  <div 
                    key={conta.id} 
                    className="relative p-4 rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Header com emblema do banco */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {bancoInfo ? (
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold shadow-md"
                            style={{ 
                              backgroundColor: bancoInfo.cor,
                              color: bancoInfo.corTexto
                            }}
                          >
                            {bancoInfo.codigo}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{conta.nome}</p>
                          <p className="text-sm text-muted-foreground">{conta.banco || "Banco não informado"}</p>
                        </div>
                      </div>
                      <Badge variant={tipoBadge.variant} className="text-xs">
                        {tipoBadge.label}
                      </Badge>
                    </div>

                    {/* Informações da conta */}
                    <div className="space-y-1 mb-4">
                      {!isCartao && conta.agencia && (
                        <p className="text-sm text-muted-foreground">
                          Agência: <span className="text-foreground">{conta.agencia}</span>
                        </p>
                      )}
                      {conta.numero_conta && (
                        <p className="text-sm text-muted-foreground">
                          {isCartao ? "Final: " : "Conta: "}
                          <span className="text-foreground">
                            {isCartao ? `****${conta.numero_conta}` : conta.numero_conta}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Saldo */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isCartao ? "Limite" : "Saldo Inicial"}
                        </p>
                        <p className={`text-lg font-bold ${conta.saldo_inicial >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          R$ {Math.abs(conta.saldo_inicial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit("Conta", conta)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick("Conta", conta.id, conta.nome)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fornecedores */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Fornecedores</span>
              <Badge variant="secondary" className="ml-2">{fornecedores.length}</Badge>
            </div>
            <Button onClick={() => handleAdd("Fornecedor")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fornecedores.map((fornecedor) => (
              <div key={fornecedor.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium">{fornecedor.nome}</p>
                  {fornecedor.documento && (
                    <p className="text-sm text-muted-foreground">Documento: {fornecedor.documento}</p>
                  )}
                  {fornecedor.email && (
                    <p className="text-sm text-muted-foreground">Contato: {fornecedor.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit("Fornecedor", fornecedor)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteClick("Fornecedor", fornecedor.id, fornecedor.nome)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {fornecedores.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhum fornecedor cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clientes */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Clientes</span>
            </div>
            <Button onClick={() => handleAdd("Cliente")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium">{cliente.nome}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {cliente.cnpj}</p>
                  <p className="text-sm text-muted-foreground">Contato: {cliente.contato}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit("Cliente", cliente)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteClick("Cliente", cliente.id, cliente.nome)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias de Entrada */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tags className="w-5 h-5" />
                <span>Categorias de Entrada</span>
                <Badge variant="secondary" className="ml-2">{categoriasEntrada.length}</Badge>
              </div>
              <Button onClick={() => handleAdd("Categoria de Entrada")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoriasEntrada.map((categoria) => (
                <div key={categoria.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="font-medium">{categoria.nome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit("Categoria", categoria)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick("Categoria", categoria.id, categoria.nome)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {categoriasEntrada.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma categoria de entrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categorias de Saída */}
        <Card className="h-molina-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tags className="w-5 h-5" />
                <span>Categorias de Saída</span>
                <Badge variant="secondary" className="ml-2">{categoriasSaida.length}</Badge>
              </div>
              <Button onClick={() => handleAdd("Categoria de Saída")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoriasSaida.map((categoria) => (
                <div key={categoria.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="font-medium">{categoria.nome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit("Categoria", categoria)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick("Categoria", categoria.id, categoria.nome)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {categoriasSaida.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma categoria de saída</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centros de Custo */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Centros de Custo</span>
              <Badge variant="secondary" className="ml-2">{centrosCusto.length}</Badge>
            </div>
            <Button onClick={() => handleAdd("Centro de Custo")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Centro
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {centrosCusto.map((centro) => (
              <div key={centro.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">{centro.nome}</p>
                      {centro.descricao && (
                        <p className="text-sm text-muted-foreground">{centro.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit("Centro de Custo", centro)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteClick("Centro de Custo", centro.id, centro.nome)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {centrosCusto.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhum centro de custo cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Futuras */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações Avançadas (Futuras)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🔐 Usuários e Permissões</h4>
              <p className="text-xs text-muted-foreground">Controle de acesso multi-usuário</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🔔 Notificações</h4>
              <p className="text-xs text-muted-foreground">Alertas de vencimento e lembretes</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🏦 Integração Bancária</h4>
              <p className="text-xs text-muted-foreground">Configuração de APIs dos bancos</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">📊 Backup Automático</h4>
              <p className="text-xs text-muted-foreground">Configuração de backups regulares</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">🎨 Personalização</h4>
              <p className="text-xs text-muted-foreground">Temas e layout personalizados</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">📱 Configurações Mobile</h4>
              <p className="text-xs text-muted-foreground">Sincronização com app mobile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet para Nova Conta */}
      <NovaContaSheet
        open={novaContaOpen}
        onOpenChange={setNovaContaOpen}
        onSuccess={refetch}
        editingConta={editingConta}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfiguracaoTab;
