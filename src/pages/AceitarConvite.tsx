import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, XCircle, Building2, UserPlus } from "lucide-react";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatPhone } from "@/utils/documentValidation";

interface InviteData {
  valid: boolean;
  email?: string;
  role?: string;
  workspace_name?: string;
  workspace_id?: string;
  error?: string;
}

const AceitarConvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [step, setStep] = useState<"loading" | "invalid" | "login" | "form" | "success">("loading");
  
  // Form state for new users
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    documentType: "cpf" as "cpf" | "cnpj",
    documentValue: "",
  });

  // Validate invite token
  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setStep("invalid");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_invite_by_token", {
          p_token: token,
        });

        if (error) throw error;

        const inviteInfo = data as unknown as InviteData;
        setInviteData(inviteInfo);

        if (!inviteInfo.valid) {
          setStep("invalid");
        } else if (!user && !authLoading) {
          setStep("login");
        } else if (user) {
          setStep("form");
        }
      } catch (error) {
        console.error("Erro ao validar convite:", error);
        setStep("invalid");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      validateInvite();
    }
  }, [token, user, authLoading]);

  // Update step when auth changes
  useEffect(() => {
    if (!authLoading && inviteData?.valid) {
      if (user) {
        setStep("form");
      } else {
        setStep("login");
      }
    }
  }, [user, authLoading, inviteData]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleDocumentChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = formData.documentType === "cpf" 
      ? formatCPF(cleaned) 
      : formatCNPJ(cleaned);
    setFormData(prev => ({ ...prev, documentValue: formatted }));
  };

  const handleDocumentTypeChange = (type: "cpf" | "cnpj") => {
    setFormData(prev => ({ 
      ...prev, 
      documentType: type, 
      documentValue: "" 
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Nome é obrigatório";
    }
    
    if (!formData.phone.trim()) {
      return "Telefone é obrigatório";
    }

    const cleanDoc = formData.documentValue.replace(/\D/g, "");
    if (!cleanDoc) {
      return "Documento é obrigatório";
    }

    if (formData.documentType === "cpf") {
      if (cleanDoc.length !== 11 || !validateCPF(cleanDoc)) {
        return "CPF inválido";
      }
    } else {
      if (cleanDoc.length !== 14 || !validateCNPJ(cleanDoc)) {
        return "CNPJ inválido";
      }
    }

    return null;
  };

  const handleAcceptInvite = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (!user || !token) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para aceitar o convite",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      const cleanDocument = formData.documentValue.replace(/\D/g, "");

      const { data, error } = await supabase.rpc("accept_invite", {
        p_token: token,
        p_auth_user_id: user.id,
        p_name: formData.name.trim(),
        p_email: inviteData?.email || user.email || "",
        p_phone: cleanPhone,
        p_document_type: formData.documentType,
        p_document_value: cleanDocument,
      });

      if (error) throw error;

      const result = data as { success: boolean; user_id: string; workspace_id: string; role: string };
      
      if (result.success) {
        setStep("success");
        toast({
          title: "Convite aceito!",
          description: `Você agora faz parte de ${inviteData?.workspace_name}`,
        });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Erro ao aceitar convite:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível aceitar o convite",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleGoToLogin = () => {
    // Store token in sessionStorage to recover after login
    if (token) {
      sessionStorage.setItem("pendingInviteToken", token);
    }
    navigate(`/auth?redirect=/aceitar-convite?token=${token}`);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {step === "invalid" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>Convite Inválido</CardTitle>
              <CardDescription>
                Este convite não existe, já foi utilizado ou expirou.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/")} 
                className="w-full"
              >
                Voltar ao início
              </Button>
            </CardContent>
          </>
        )}

        {step === "login" && inviteData && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Você foi convidado!</CardTitle>
              <CardDescription>
                Você foi convidado para participar de <strong>{inviteData.workspace_name}</strong> como <strong>{inviteData.role === "admin" ? "Administrador" : "Usuário"}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Convite para:</p>
                <p className="font-medium">{inviteData.email}</p>
              </div>
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Entrar ou criar conta
              </Button>
            </CardContent>
          </>
        )}

        {step === "form" && inviteData && (
          <>
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-center">Complete seu cadastro</CardTitle>
              <CardDescription className="text-center">
                Preencha seus dados para participar de <strong>{inviteData.workspace_name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  disabled={accepting}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  disabled={accepting}
                />
              </div>

              {/* Document Type */}
              <div className="space-y-3">
                <Label>Tipo de Documento</Label>
                <RadioGroup
                  value={formData.documentType}
                  onValueChange={(value) => handleDocumentTypeChange(value as "cpf" | "cnpj")}
                  className="flex gap-4"
                  disabled={accepting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cpf" id="cpf" />
                    <Label htmlFor="cpf" className="cursor-pointer">CPF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cnpj" id="cnpj" />
                    <Label htmlFor="cnpj" className="cursor-pointer">CNPJ</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Document */}
              <div className="space-y-2">
                <Label htmlFor="document">
                  {formData.documentType === "cpf" ? "CPF" : "CNPJ"} *
                </Label>
                <Input
                  id="document"
                  value={formData.documentValue}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={formData.documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={formData.documentType === "cpf" ? 14 : 18}
                  disabled={accepting}
                />
              </div>

              <Button 
                onClick={handleAcceptInvite} 
                className="w-full"
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceitar convite
                  </>
                )}
              </Button>
            </CardContent>
          </>
        )}

        {step === "success" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>Bem-vindo!</CardTitle>
              <CardDescription>
                Você agora faz parte de <strong>{inviteData?.workspace_name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground text-sm">
                Redirecionando para o dashboard...
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AceitarConvite;
