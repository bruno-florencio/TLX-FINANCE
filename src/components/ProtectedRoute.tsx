import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInternalUser } from "@/hooks/useInternalUser";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompleteRegistration?: boolean;
}

const ProtectedRoute = ({ children, requireCompleteRegistration = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompleteRegistration, loading: userLoading } = useInternalUser();
  const navigate = useNavigate();

  const loading = authLoading || (requireCompleteRegistration && userLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Se requer cadastro completo e usuário não tem, redirecionar para cadastro
    if (requireCompleteRegistration && !userLoading && user && !hasCompleteRegistration) {
      navigate("/cadastro", { replace: true });
    }
  }, [user, authLoading, userLoading, hasCompleteRegistration, requireCompleteRegistration, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Se requer cadastro completo e não tem, não renderizar
  if (requireCompleteRegistration && !hasCompleteRegistration) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
