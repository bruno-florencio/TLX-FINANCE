import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Users, 
  Building, 
  CreditCard,
  Tags,
  Plus,
  Edit,
  Trash2,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ConfiguracaoTab = () => {
  const { toast } = useToast();
  
  // Mock data para demonstração
  const [fornecedores] = useState([
    { id: 1, nome: "ABC Ltda", cnpj: "12.345.678/0001-90", contato: "contato@abc.com" },
    { id: 2, nome: "Fornecedor XYZ", cnpj: "98.765.432/0001-10", contato: "vendas@xyz.com" },
    { id: 3, nome: "Distribuidora 123", cnpj: "11.222.333/0001-44", contato: "comercial@123.com" }
  ]);

  const [clientes] = useState([
    { id: 1, nome: "Empresa Cliente A", cnpj: "44.555.666/0001-77", contato: "financeiro@clientea.com" },
    { id: 2, nome: "Cliente B Ltda", cnpj: "33.444.555/0001-88", contato: "pagamentos@clienteb.com" },
    { id: 3, nome: "Corporação C", cnpj: "22.333.444/0001-99", contato: "contas@corporacaoc.com" }
  ]);

  const [contasBancarias] = useState([
    { id: 1, banco: "Banco do Brasil", agencia: "1234-5", conta: "12345-6", tipo: "Corrente" },
    { id: 2, banco: "Itaú", agencia: "5678-9", conta: "98765-4", tipo: "Poupança" },
    { id: 3, banco: "Nubank", agencia: "0001", conta: "12345678-9", tipo: "Digital" }
  ]);

  const [categoriasEntrada] = useState([
    { id: 1, nome: "Vendas", cor: "green" },
    { id: 2, nome: "Serviços", cor: "blue" },
    { id: 3, nome: "Consultoria", cor: "purple" },
    { id: 4, nome: "E-commerce", cor: "orange" }
  ]);

  const [categoriasSaida] = useState([
    { id: 1, nome: "Fornecedores", cor: "red" },
    { id: 2, nome: "Despesas Fixas", cor: "gray" },
    { id: 3, nome: "Suprimentos", cor: "yellow" },
    { id: 4, nome: "Utilidades", cor: "cyan" },
    { id: 5, nome: "Tecnologia", cor: "indigo" }
  ]);

  const [centrosCusto] = useState([
    { id: 1, nome: "Administrativo", cor: "blue", descricao: "Despesas administrativas e gestão" },
    { id: 2, nome: "Comercial", cor: "green", descricao: "Vendas e marketing" },
    { id: 3, nome: "Produção", cor: "orange", descricao: "Custos de produção e fabricação" },
    { id: 4, nome: "Financeiro", cor: "purple", descricao: "Operações financeiras" },
    { id: 5, nome: "TI", cor: "indigo", descricao: "Tecnologia da informação" },
    { id: 6, nome: "RH", cor: "pink", descricao: "Recursos humanos" }
  ]);

  const handleEdit = (type: string, item: any) => {
    toast({
      title: `Editar ${type}`,
      description: `Modal de edição será implementado para: ${item.nome || item.banco}`,
    });
  };

  const handleDelete = (type: string, id: number) => {
    toast({
      title: `${type} Excluído`,
      description: "Item removido com sucesso.",
      variant: "destructive"
    });
  };

  const handleAdd = (type: string) => {
    toast({
      title: `Novo ${type}`,
      description: "Modal de cadastro será implementado.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-american-captain text-foreground">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie fornecedores, clientes, contas bancárias e categorias
        </p>
      </div>

      {/* Fornecedores */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Fornecedores</span>
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
                  <p className="text-sm text-muted-foreground">CNPJ: {fornecedor.cnpj}</p>
                  <p className="text-sm text-muted-foreground">Contato: {fornecedor.contato}</p>
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
                    onClick={() => handleDelete("Fornecedor", fornecedor.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
                    onClick={() => handleDelete("Cliente", cliente.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contas Bancárias */}
      <Card className="h-molina-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Contas Bancárias</span>
            </div>
            <Button onClick={() => handleAdd("Conta Bancária")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contasBancarias.map((conta) => (
              <div key={conta.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium">{conta.banco}</p>
                  <p className="text-sm text-muted-foreground">
                    Ag: {conta.agencia} | Conta: {conta.conta}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {conta.tipo}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit("Conta", conta)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete("Conta", conta.id)}
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
                    <div className={`w-4 h-4 rounded-full bg-${categoria.cor}-500`}></div>
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
                      onClick={() => handleDelete("Categoria", categoria.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                    <div className={`w-4 h-4 rounded-full bg-${categoria.cor}-500`}></div>
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
                      onClick={() => handleDelete("Categoria", categoria.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                    <div className={`w-4 h-4 rounded-full bg-${centro.cor}-500`}></div>
                    <div>
                      <p className="font-medium">{centro.nome}</p>
                      <p className="text-sm text-muted-foreground">{centro.descricao}</p>
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
                    onClick={() => handleDelete("Centro de Custo", centro.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default ConfiguracaoTab;