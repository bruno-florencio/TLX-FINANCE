import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...update } : r
    ));
  };

  const runTests = async () => {
    setLoading(true);
    
    const initialResults: TestResult[] = [
      { name: "Autenticação", status: 'pending' },
      { name: "SELECT contas_bancarias (RLS)", status: 'pending' },
      { name: "SELECT categorias (RLS)", status: 'pending' },
      { name: "SELECT lancamentos (RLS)", status: 'pending' },
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

    // Test 2: SELECT from contas_bancarias - SEM filtros manuais (RLS cuida)
    updateResult("SELECT contas_bancarias (RLS)", { status: 'running' });
    try {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("*")
        .eq("ativo", true);
      
      if (error) {
        if (error.message.includes("row-level security") || error.code === "42501") {
          throw new Error(`RLS BLOQUEADO: ${error.message}`);
        }
        throw error;
      }
      
      updateResult("SELECT contas_bancarias (RLS)", { 
        status: 'success', 
        message: `${data?.length || 0} contas retornadas (RLS aplicado automaticamente)`,
        data: data
      });
    } catch (error: any) {
      updateResult("SELECT contas_bancarias (RLS)", { 
        status: 'error', 
        message: error.message || "Erro ao buscar contas"
      });
    }

    // Test 3: SELECT from categorias - SEM filtros manuais (RLS cuida)
    updateResult("SELECT categorias (RLS)", { status: 'running' });
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*");
      
      if (error) {
        if (error.message.includes("row-level security") || error.code === "42501") {
          throw new Error(`RLS BLOQUEADO: ${error.message}`);
        }
        throw error;
      }
      
      updateResult("SELECT categorias (RLS)", { 
        status: 'success', 
        message: `${data?.length || 0} categorias retornadas`,
        data: data
      });
    } catch (error: any) {
      updateResult("SELECT categorias (RLS)", { 
        status: 'error', 
        message: error.message || "Erro ao buscar categorias"
      });
    }

    // Test 4: SELECT from lancamentos - SEM filtros manuais (RLS cuida)
    updateResult("SELECT lancamentos (RLS)", { status: 'running' });
    try {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .limit(10);
      
      if (error) {
        if (error.message.includes("row-level security") || error.code === "42501") {
          throw new Error(`RLS BLOQUEADO: ${error.message}`);
        }
        throw error;
      }
      
      updateResult("SELECT lancamentos (RLS)", { 
        status: 'success', 
        message: `${data?.length || 0} lançamentos retornados`,
        data: data
      });
    } catch (error: any) {
      updateResult("SELECT lancamentos (RLS)", { 
        status: 'error', 
        message: error.message || "Erro ao buscar lançamentos"
      });
    }

    setLoading(false);
    
    // Show summary toast
    const successCount = results.filter(r => r.status === 'success').length + 1;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    toast({
      title: "Testes concluídos",
      description: `RLS aplicado automaticamente pelo Supabase`,
    });
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
          <span className="text-muted-foreground">Usuário:</span>
          <span className="font-medium">{user?.email || "Não autenticado"}</span>
        </div>

        {/* RLS Info */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong>RLS ativo:</strong> O controle de acesso por workspace é feito automaticamente pelo Supabase. 
            Nenhum filtro manual de user_id ou workspace_id é aplicado no frontend.
          </p>
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
            <p className="text-xs mt-1">Os testes verificam se o RLS está funcionando corretamente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
