import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  Shield, 
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const SupabaseIntegrationTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testAccountId, setTestAccountId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState("Conta Teste Supabase");

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...update } : r
    ));
  };

  const runTests = async () => {
    setLoading(true);
    setTestAccountId(null);
    
    const initialResults: TestResult[] = [
      { name: "Autenticação", status: 'pending' },
      { name: "SELECT contas_bancarias", status: 'pending' },
      { name: "INSERT conta teste", status: 'pending' },
      { name: "Verificar INSERT", status: 'pending' },
      { name: "DELETE conta teste", status: 'pending' },
    ];
    setResults(initialResults);

    // Test 1: Check Authentication
    updateResult("Autenticação", { status: 'running' });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) throw new Error("Usuário não autenticado");
      
      updateResult("Autenticação", { 
        status: 'success', 
        message: `Usuário: ${session.user.email}`,
        data: { userId: session.user.id, email: session.user.email }
      });
    } catch (error: any) {
      updateResult("Autenticação", { 
        status: 'error', 
        message: error.message || "Falha na autenticação"
      });
      setLoading(false);
      return;
    }

    // Test 2: SELECT from contas_bancarias
    updateResult("SELECT contas_bancarias", { status: 'running' });
    try {
      const { data, error, count } = await supabase
        .from("contas_bancarias")
        .select("*", { count: 'exact' })
        .eq("ativo", true);
      
      if (error) {
        // Check if it's an RLS error
        if (error.message.includes("row-level security") || error.code === "42501") {
          throw new Error(`RLS BLOQUEADO: ${error.message}`);
        }
        throw error;
      }
      
      updateResult("SELECT contas_bancarias", { 
        status: 'success', 
        message: `${data?.length || 0} contas encontradas (RLS aplicado por workspace)`,
        data: data
      });
    } catch (error: any) {
      updateResult("SELECT contas_bancarias", { 
        status: 'error', 
        message: error.message || "Erro ao buscar contas"
      });
    }

    // Test 3: INSERT new account
    updateResult("INSERT conta teste", { status: 'running' });
    try {
      // First, we need to get a workspace_id for the current user
      const { data: workspaceUsers, error: wsError } = await supabase
        .from("workspace_users")
        .select("workspace_id")
        .eq("user_id", user?.id)
        .limit(1);

      if (wsError) {
        if (wsError.message.includes("row-level security") || wsError.code === "42501") {
          throw new Error(`RLS BLOQUEADO em workspace_users: ${wsError.message}`);
        }
        throw wsError;
      }

      if (!workspaceUsers || workspaceUsers.length === 0) {
        throw new Error("Usuário não possui workspace associado. Crie um workspace primeiro.");
      }

      const workspaceId = workspaceUsers[0].workspace_id;

      const { data, error } = await supabase
        .from("contas_bancarias")
        .insert({
          nome: newAccountName,
          tipo: "corrente",
          banco: "Banco Teste",
          saldo_inicial: 0,
          saldo_atual: 0,
          ativo: true,
          workspace_id: workspaceId,
          user_id: user?.id
        })
        .select()
        .single();
      
      if (error) {
        if (error.message.includes("row-level security") || error.code === "42501") {
          throw new Error(`RLS BLOQUEADO: ${error.message}`);
        }
        throw error;
      }
      
      setTestAccountId(data.id);
      updateResult("INSERT conta teste", { 
        status: 'success', 
        message: `Conta "${data.nome}" criada com ID: ${data.id}`,
        data: data
      });
    } catch (error: any) {
      updateResult("INSERT conta teste", { 
        status: 'error', 
        message: error.message || "Erro ao inserir conta"
      });
      // Skip remaining tests if insert failed
      updateResult("Verificar INSERT", { status: 'error', message: "Teste pulado - INSERT falhou" });
      updateResult("DELETE conta teste", { status: 'error', message: "Teste pulado - INSERT falhou" });
      setLoading(false);
      return;
    }

    // Test 4: Verify INSERT
    updateResult("Verificar INSERT", { status: 'running' });
    try {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("*")
        .eq("id", testAccountId || results.find(r => r.name === "INSERT conta teste")?.data?.id)
        .single();
      
      if (error) throw error;
      
      updateResult("Verificar INSERT", { 
        status: 'success', 
        message: `Conta verificada: ${data.nome}`,
        data: data
      });
    } catch (error: any) {
      updateResult("Verificar INSERT", { 
        status: 'error', 
        message: error.message || "Erro ao verificar conta"
      });
    }

    // Test 5: DELETE test account
    updateResult("DELETE conta teste", { status: 'running' });
    const accountIdToDelete = testAccountId || results.find(r => r.name === "INSERT conta teste")?.data?.id;
    
    if (accountIdToDelete) {
      try {
        const { error } = await supabase
          .from("contas_bancarias")
          .delete()
          .eq("id", accountIdToDelete);
        
        if (error) {
          if (error.message.includes("row-level security") || error.code === "42501") {
            throw new Error(`RLS BLOQUEADO: ${error.message}`);
          }
          throw error;
        }
        
        updateResult("DELETE conta teste", { 
          status: 'success', 
          message: "Conta de teste removida com sucesso"
        });
        setTestAccountId(null);
      } catch (error: any) {
        updateResult("DELETE conta teste", { 
          status: 'error', 
          message: error.message || "Erro ao deletar conta"
        });
      }
    } else {
      updateResult("DELETE conta teste", { 
        status: 'error', 
        message: "ID da conta não encontrado"
      });
    }

    setLoading(false);
    
    // Show summary toast
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    if (errorCount === 0) {
      toast({
        title: "Testes concluídos",
        description: `Todos os ${successCount} testes passaram!`,
      });
    } else {
      toast({
        title: "Testes finalizados",
        description: `${successCount} sucesso, ${errorCount} erros`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-muted" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-entrada" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-saida" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'running':
        return <Badge className="bg-primary">Executando...</Badge>;
      case 'success':
        return <Badge className="entrada-indicator">Sucesso</Badge>;
      case 'error':
        return <Badge className="saida-indicator">Erro</Badge>;
    }
  };

  return (
    <Card className="clean-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold">
              Teste de Integração Supabase
            </CardTitle>
          </div>
          <Button 
            onClick={runTests} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Executar Testes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Usuário autenticado:</span>
          <span className="font-medium">{user?.email || "Não autenticado"}</span>
        </div>

        {/* Test Account Name Input */}
        <div className="space-y-2">
          <Label htmlFor="accountName">Nome da conta de teste</Label>
          <Input
            id="accountName"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="Nome da conta de teste"
          />
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Resultados:</h4>
            <div className="space-y-2">
              {results.map((result) => (
                <div 
                  key={result.name}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${result.status === 'error' 
                      ? 'bg-destructive/5 border-destructive/20' 
                      : result.status === 'success'
                        ? 'bg-entrada/5 border-entrada/20'
                        : 'bg-muted/30 border-border/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-sm">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  {result.message && (
                    <p className={`
                      text-xs mt-1.5 pl-6
                      ${result.status === 'error' ? 'text-saida' : 'text-muted-foreground'}
                    `}>
                      {result.message}
                    </p>
                  )}
                  {result.status === 'error' && result.message?.includes('RLS') && (
                    <div className="flex items-center gap-1.5 mt-2 pl-6 text-xs text-saida">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Policy RLS bloqueou a operação - verifique as permissões do workspace</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Clique em "Executar Testes" para validar a integração</p>
            <p className="text-xs mt-1">Os testes irão verificar autenticação, leitura e escrita no banco</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
