import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInternalUser } from "@/hooks/useInternalUser";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Save, User, Building2 } from "lucide-react";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatPhone } from "@/utils/documentValidation";
import EquipeSection from "@/components/perfil/EquipeSection";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { internalUser, loading: userLoading, refetch: refetchUser } = useInternalUser();
  const { workspaceId, workspace, loading: workspaceLoading, refetch: refetchWorkspace } = useWorkspace();
  
  const [saving, setSaving] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const autoCreateAttempted = useRef(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    documentType: "cpf" as "cpf" | "cnpj",
    documentValue: "",
    tradeName: "",
  });

  // AUTO-CREATE WORKSPACE if user exists but has no workspace
  useEffect(() => {
    let isMounted = true;
    
    const autoCreateWorkspace = async () => {
      // Only run once, and only if user exists without workspace
      if (autoCreateAttempted.current || userLoading || workspaceLoading) return;
      if (!internalUser || workspaceId) return;
      
      autoCreateAttempted.current = true;
      
      if (isMounted) {
        setCreatingWorkspace(true);
        toast({
          title: "Primeiro acesso",
          description: "Criando seu workspace...",
        });
      }
      
      try {
        const defaultName = internalUser.trade_name || internalUser.name || user?.email || "Meu Workspace";
        
        const { data: newWorkspace, error: createError } = await supabase
          .from("workspaces")
          .insert({
            nome: defaultName,
            created_by_user_id: internalUser.id,
            owner_id: internalUser.auth_user_id,
          })
          .select()
          .single();

        if (!isMounted) return;
        if (createError) throw createError;

        // Update user with new workspace
        const { error: userError } = await supabase
          .from("users")
          .update({
            workspace_id: newWorkspace.id,
            role: "master",
            updated_at: new Date().toISOString(),
          })
          .eq("id", internalUser.id);

        if (!isMounted) return;
        if (userError) throw userError;

        // Add to workspace_users
        await supabase
          .from("workspace_users")
          .insert({
            user_id: internalUser.auth_user_id,
            workspace_id: newWorkspace.id,
            role: "owner",
          });

        if (!isMounted) return;

        toast({
          title: "Workspace criado!",
          description: "Seu espaço de trabalho está pronto.",
        });

        setWorkspaceName(defaultName);
        await refetchUser();
        await refetchWorkspace();
        
      } catch (error) {
        if (!isMounted) return;
        console.error("Erro ao criar workspace automaticamente:", error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o workspace. Tente manualmente.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setCreatingWorkspace(false);
        }
      }
    };
    
    autoCreateWorkspace();
    
    return () => {
      isMounted = false;
    };
  }, [internalUser, workspaceId, userLoading, workspaceLoading, user, toast, refetchUser, refetchWorkspace]);

  // Load workspace name from fetched workspace
  useEffect(() => {
    if (workspace?.nome) {
      setWorkspaceName(workspace.nome);
    }
  }, [workspace]);

  // Load user data into form
  useEffect(() => {
    if (internalUser) {
      setFormData({
        name: internalUser.name || "",
        phone: internalUser.phone ? formatPhone(internalUser.phone) : "",
        documentType: internalUser.document_type || "cpf",
        documentValue: "", // We don't have the original document, only the hash
        tradeName: internalUser.trade_name || "",
      });
    }
  }, [internalUser]);

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
      documentValue: "",
      tradeName: type === "cpf" ? "" : prev.tradeName 
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Nome é obrigatório";
    }
    
    if (!formData.phone.trim()) {
      return "Telefone é obrigatório";
    }

    // Document validation only if provided
    if (formData.documentValue.trim()) {
      const cleanDoc = formData.documentValue.replace(/\D/g, "");
      if (formData.documentType === "cpf") {
        if (cleanDoc.length !== 11 || !validateCPF(cleanDoc)) {
          return "CPF inválido";
        }
      } else {
        if (cleanDoc.length !== 14 || !validateCNPJ(cleanDoc)) {
          return "CNPJ inválido";
        }
      }
    }

    if (!workspaceName.trim()) {
      return "Nome do workspace é obrigatório";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      const cleanDocument = formData.documentValue.replace(/\D/g, "");

      if (internalUser && workspaceId) {
        // User already has workspace - just update
        const userUpdate: Record<string, unknown> = {
          name: formData.name.trim(),
          phone: cleanPhone,
          document_type: formData.documentType,
          trade_name: formData.documentType === "cnpj" ? formData.tradeName.trim() : null,
          updated_at: new Date().toISOString(),
        };

        // Only update document hash if a new document was provided
        if (cleanDocument) {
          userUpdate.document_hash = cleanDocument; // The DB will hash it
        }

        const { error: userError } = await supabase
          .from("users")
          .update(userUpdate)
          .eq("id", internalUser.id);

        if (userError) throw userError;

        // Update workspace name
        const { error: workspaceError } = await supabase
          .from("workspaces")
          .update({ nome: workspaceName.trim() })
          .eq("id", workspaceId);

        if (workspaceError) throw workspaceError;

        toast({
          title: "Sucesso!",
          description: "Perfil e workspace atualizados com sucesso.",
        });
      } else if (internalUser && !workspaceId) {
        // User exists but no workspace - create one
        const { data: newWorkspace, error: createError } = await supabase
          .from("workspaces")
          .insert({
            nome: workspaceName.trim(),
            created_by_user_id: internalUser.id,
            owner_id: internalUser.auth_user_id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update user with new workspace
        const userUpdate: Record<string, unknown> = {
          workspace_id: newWorkspace.id,
          name: formData.name.trim(),
          phone: cleanPhone,
          document_type: formData.documentType,
          trade_name: formData.documentType === "cnpj" ? formData.tradeName.trim() : null,
          role: "master",
          updated_at: new Date().toISOString(),
        };

        if (cleanDocument) {
          userUpdate.document_hash = cleanDocument;
        }

        const { error: userError } = await supabase
          .from("users")
          .update(userUpdate)
          .eq("id", internalUser.id);

        if (userError) throw userError;

        // Add to workspace_users
        const { error: wsUserError } = await supabase
          .from("workspace_users")
          .insert({
            user_id: internalUser.auth_user_id,
            workspace_id: newWorkspace.id,
            role: "owner",
          });

        if (wsUserError) throw wsUserError;

        toast({
          title: "Sucesso!",
          description: "Workspace criado e perfil atualizado com sucesso.",
        });
      } else {
        throw new Error("Usuário não encontrado. Faça login novamente.");
      }

      await refetchUser();
      
    } catch (error: unknown) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || workspaceLoading || creatingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {creatingWorkspace ? "Criando seu workspace..." : "Carregando perfil..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Meu Perfil</h1>
              <p className="text-xs text-muted-foreground">{internalUser?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Personal Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Suas informações de cadastro
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
                />
              </div>

              {/* Document Type */}
              <div className="space-y-3">
                <Label>Tipo de Pessoa</Label>
                <RadioGroup
                  value={formData.documentType}
                  onValueChange={(value) => handleDocumentTypeChange(value as "cpf" | "cnpj")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cpf" id="cpf" />
                    <Label htmlFor="cpf" className="cursor-pointer">Pessoa Física (CPF)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cnpj" id="cnpj" />
                    <Label htmlFor="cnpj" className="cursor-pointer">Pessoa Jurídica (CNPJ)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Document */}
              <div className="space-y-2">
                <Label htmlFor="document">
                  {formData.documentType === "cpf" ? "CPF" : "CNPJ"}
                  {internalUser ? " (deixe em branco para manter)" : " *"}
                </Label>
                <Input
                  id="document"
                  value={formData.documentValue}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={formData.documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={formData.documentType === "cpf" ? 14 : 18}
                />
                {internalUser && (
                  <p className="text-xs text-muted-foreground">
                    Documento já cadastrado. Preencha apenas se desejar alterar.
                  </p>
                )}
              </div>

              {/* Trade Name (only for CNPJ) */}
              {formData.documentType === "cnpj" && (
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                    placeholder="Nome fantasia da empresa"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workspace Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Workspace
              </CardTitle>
              <CardDescription>
                {workspaceId 
                  ? "Configure o nome do seu espaço de trabalho" 
                  : "Crie seu workspace para começar a usar o sistema"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="workspace">Nome do Workspace *</Label>
                <Input
                  id="workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Ex: Minha Empresa"
                />
                {!workspaceId && (
                  <p className="text-xs text-amber-600">
                    Você ainda não tem um workspace. Preencha o nome e salve para criar.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipe Section - Only for workspace owners */}
          {workspaceId && <EquipeSection />}

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
