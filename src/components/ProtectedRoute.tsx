import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { workspaceId, loading: workspaceLoading, error: workspaceError, isCreatingWorkspace, hasWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Loading estado de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Loading estado do workspace (inclui criação automática)
  if (workspaceLoading || isCreatingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isCreatingWorkspace ? "Configurando seu workspace..." : "Carregando workspace..."}
          </p>
        </div>
      </div>
    );
  }

  // Erro ao obter/criar workspace
  if (workspaceError || !hasWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Configuração</AlertTitle>
            <AlertDescription>
              {workspaceError || "Usuário não pertence a nenhum workspace. Entre em contato com o suporte."}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
            <Button variant="destructive" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
