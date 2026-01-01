import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Database, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ContaBancaria {
  id: string;
  nome: string;
  tipo: string;
  banco: string | null;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
}

const TestePage = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContas = async () => {
    setLoading(true);
    setError(null);

    // Query simples SEM filtros - RLS cuida do acesso
    const { data, error: fetchError } = await supabase
      .from("contas_bancarias")
      .select("*");

    if (fetchError) {
      setError(fetchError.message);
      setContas([]);
    } else {
      setContas(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchContas();
    }
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teste de RLS</h1>
            <p className="text-muted-foreground text-sm">
              Listagem de contas_bancarias sem filtros manuais
            </p>
          </div>
          <Button onClick={fetchContas} disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Recarregar
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">RLS Ativo</p>
                <p className="text-muted-foreground">
                  Esta query não aplica filtros de user_id ou workspace_id.
                  O Supabase retorna apenas os dados permitidos pelas políticas RLS.
                </p>
                <code className="block mt-2 p-2 bg-background rounded text-xs">
                  supabase.from("contas_bancarias").select("*")
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <CheckCircle className="w-4 h-4 text-entrada" />
                  <span>Autenticado como: <strong>{user.email}</strong></span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-saida" />
                  <span className="text-saida">Usuário não autenticado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-saida">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Resultados: {contas.length} registro(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : contas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma conta encontrada</p>
                <p className="text-xs mt-1">
                  Verifique se existem dados no workspace do usuário
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contas.map((conta) => (
                  <div
                    key={conta.id}
                    className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{conta.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {conta.tipo} • {conta.banco || "Sem banco"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(conta.saldo_atual)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conta.ativo ? "Ativa" : "Inativa"}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                      ID: {conta.id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestePage;
