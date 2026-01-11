import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInternalUser } from "@/hooks/useInternalUser";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { internalUser, loading: internalLoading, hasCompleteRegistration } = useInternalUser();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const mountedRef = useRef(true);

  // Track mounted state for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Don't do anything while loading
    if (authLoading || internalLoading) return;

    // Not authenticated -> go to auth
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Authenticated but no internal user -> go to perfil to complete
    if (user && !hasCompleteRegistration) {
      // Only redirect if not already on perfil
      if (window.location.pathname !== "/perfil") {
        navigate("/perfil", { replace: true });
        return;
      }
    }

    // All good, show content
    if (mountedRef.current) {
      setShowContent(true);
    }
  }, [user, authLoading, internalLoading, hasCompleteRegistration, navigate]);

  // Loading state with descriptive message
  if (authLoading || internalLoading) {
    const message = authLoading ? "Verificando autenticação..." : "Carregando perfil...";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  // No user after loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Show content when ready
  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
