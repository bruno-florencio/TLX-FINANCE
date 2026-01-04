import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Legacy route - redirects to appropriate page
 * - If not authenticated: redirect to /auth (unified registration)
 * - If authenticated: redirect to / (dashboard)
 */
const Cadastro = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, go to dashboard
        navigate("/", { replace: true });
      } else {
        // Not authenticated, go to auth page for registration
        navigate("/auth", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Cadastro;
