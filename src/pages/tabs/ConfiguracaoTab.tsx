import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building, 
  CreditCard,
  Tags,
  Plus,
  Edit,
  Trash2,
  Target,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import NovaContaSheet from "@/components/forms/NovaContaSheet";
import CadastroEntitySheet, { EntityType } from "@/components/forms/CadastroEntitySheet";
import { bancosUnicos } from "@/data/bancosBrasileiros";
import { BankLogo, CardBrandLogo } from "@/components/ui/BankLogo";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ConfiguracaoTab = () => {
  const { toast } = useToast();
  // Buscar TODOS os dados (incluindo inativos) para gerenciamento
  const { contas, categorias, centrosCusto, fornecedores, clientes, loading, refetch } = useSupabaseData({ includeInactive: true });
  
  // States para contas bancárias
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  
  // States para CRUD genérico
  const [entitySheetOpen, setEntitySheetOpen] = useState(false);
  const [currentEntityType, setCurrentEntityType] = useState<EntityType>("fornecedor");
  const [editingEntity, setEditingEntity] = useState<any>(null);
  
  // States para exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; nome: string } | null>(null);

  const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
  const categoriasSaida = categorias.filter(c => c.tipo === 'saida');

  // Handlers para Contas Bancárias
  const handleEditConta = (conta: any) => {
    setEditingConta(conta);
    setNovaContaOpen(true);
  };

  const handleAddConta = () => {
    setEditingConta(null);
    setNovaContaOpen(true);
  };

  // Handlers para Entidades Genéricas (Fornecedor, Cliente, Categoria, Centro de Custo)
  const handleAddEntity = (entityType: EntityType) => {
    setCurrentEntityType(entityType);
    setEditingEntity(null);
    setEntitySheetOpen(true);
  };

  const handleEditEntity = (entityType: EntityType, item: any) => {
    setCurrentEntityType(entityType);
    setEditingEntity(item);
    setEntitySheetOpen(true);
  };

  const handleEntitySuccess = () => {
    refetch();
    setEntitySheetOpen(false);
    setEditingEntity(null);
  };

  // Handler para deletar
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
          tableName = "contas_bancarias";
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
        case "Cliente":
          tableName = "clientes";
          break;
        default:
          return;
      }

      if (itemToDelete.type === "Cliente") {
        // Soft delete para clientes também (agora tem campo ativo)
        const { error } = await supabase
          .from("clientes")
          .update({ ativo: false })
          .eq("id", itemToDelete.id);

        if (error) throw error;
        refetch();
      } else {
        // Soft delete: marcar como inativo
        const { error } = await supabase
          .from(tableName as any)
          .update({ ativo: false } as any)
          .eq("id", itemToDelete.id);

        if (error) throw error;
        refetch();
      }

      toast({
        title: `${itemToDelete.type} Excluído`,
        description: `${itemToDelete.nome} foi removido com sucesso.`,
      });
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

  // Toggle status ativo/inativo
  const handleToggleAtivo = async (tableName: string, id: string, currentAtivo: boolean) => {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ ativo: !currentAtivo } as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentAtivo ? "Desativado" : "Ativado",
        description: `Item ${currentAtivo ? "desativado" : "ativado"} com sucesso.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status.",
        variant: "destructive",
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
        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
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
            <Button onClick={handleAddConta} size="sm">
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
                const tipoBadge = getTipoContaBadge(conta.tipo);
                const isCartao = conta.tipo === "cartao_credito";
                
                return (
                  <div 
                    key={conta.id} 
                    className="relative p-4 rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Header com emblema do banco ou bandeira do cartão */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isCartao ? (
                          <CardBrandLogo brandId={conta.bandeira} size="md" />
                        ) : (
                          <BankLogo bankName={conta.banco} size="md" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{conta.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {isCartao 
                              ? conta.bandeira || "Bandeira não informada"
                              : conta.banco || "Banco não informado"
                            }
                          </p>
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
                          onClick={() => handleEditConta(conta)}
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
            <Button onClick={() => handleAddEntity("fornecedor")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fornecedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum fornecedor cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.documento || "-"}</TableCell>
                      <TableCell>{fornecedor.email || "-"}</TableCell>
                      <TableCell>{fornecedor.telefone || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                          {fornecedor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditEntity("fornecedor", fornecedor)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleAtivo("fornecedores", fornecedor.id, fornecedor.ativo)}
                            title={fornecedor.ativo ? "Desativar" : "Ativar"}
                          >
                            {fornecedor.ativo ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick("Fornecedor", fornecedor.id, fornecedor.nome)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clientes */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Clientes</span>
              <Badge variant="secondary" className="ml-2">{clientes.length}</Badge>
            </div>
            <Button onClick={() => handleAddEntity("cliente")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.documento || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cliente.ativo ? "default" : "secondary"}>
                          {cliente.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditEntity("cliente", cliente)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleAtivo("clientes", cliente.id, cliente.ativo)}
                            title={cliente.ativo ? "Desativar" : "Ativar"}
                          >
                            {cliente.ativo ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick("Cliente", cliente.id, cliente.nome)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
              <Button onClick={() => handleAddEntity("categoria_entrada")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriasEntrada.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tags className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma categoria de entrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriasEntrada.map((categoria) => (
                  <div key={categoria.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.cor || "#22C55E" }}
                      />
                      <span className="font-medium">{categoria.nome}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditEntity("categoria_entrada", categoria)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick("Categoria", categoria.id, categoria.nome)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <Button onClick={() => handleAddEntity("categoria_saida")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriasSaida.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tags className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma categoria de saída</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriasSaida.map((categoria) => (
                  <div key={categoria.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.cor || "#EF4444" }}
                      />
                      <span className="font-medium">{categoria.nome}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditEntity("categoria_saida", categoria)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick("Categoria", categoria.id, categoria.nome)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <Button onClick={() => handleAddEntity("centro_custo")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Centro
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centrosCusto.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum centro de custo cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centrosCusto.map((centro) => (
                    <TableRow key={centro.id}>
                      <TableCell className="font-medium">{centro.nome}</TableCell>
                      <TableCell>{centro.descricao || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={centro.ativo ? "default" : "secondary"}>
                          {centro.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditEntity("centro_custo", centro)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleAtivo("centros_custo", centro.id, centro.ativo)}
                            title={centro.ativo ? "Desativar" : "Ativar"}
                          >
                            {centro.ativo ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick("Centro de Custo", centro.id, centro.nome)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet para Nova Conta Bancária */}
      <NovaContaSheet 
        open={novaContaOpen} 
        onOpenChange={(open) => {
          setNovaContaOpen(open);
          if (!open) setEditingConta(null);
        }}
        editingConta={editingConta}
        onSuccess={() => {
          refetch();
          setNovaContaOpen(false);
          setEditingConta(null);
        }}
      />

      {/* Sheet para Cadastro de Entidades (Fornecedor, Cliente, Categoria, Centro Custo) */}
      <CadastroEntitySheet
        open={entitySheetOpen}
        onOpenChange={setEntitySheetOpen}
        entityType={currentEntityType}
        editingItem={editingEntity}
        onSuccess={handleEntitySuccess}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type.toLowerCase()} "{itemToDelete?.nome}"? 
              {itemToDelete?.type !== "Cliente" && " O item será marcado como inativo."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfiguracaoTab;
