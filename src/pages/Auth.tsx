import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, AlertCircle, UserPlus, ArrowLeft, Building2, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  validateCPF, 
  validateCNPJ, 
  validateEmail, 
  validatePassword,
  validateBirthDate,
  formatCPF,
  formatCNPJ,
  formatPhone
} from '@/utils/documentValidation';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  documentType: 'cpf' | 'cnpj';
  name: string;
  documentValue: string;
  tradeName: string;
  birthDate: string;
  phone: string;
  workspaceName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  documentValue?: string;
  tradeName?: string;
  birthDate?: string;
  phone?: string;
  workspaceName?: string;
}

type ViewMode = 'login' | 'register' | 'validating' | 'success';

const Auth = () => {
  const [mode, setMode] = useState<ViewMode>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    documentType: 'cpf',
    name: '',
    documentValue: '',
    tradeName: '',
    birthDate: '',
    phone: '',
    workspaceName: ''
  });
  
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!loginEmail.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(loginEmail)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!loginPassword) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Password
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else {
      const pwdValidation = validatePassword(formData.password);
      if (!pwdValidation.valid) {
        newErrors.password = pwdValidation.message;
      }
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    // Name
    if (!formData.name.trim()) {
      newErrors.name = formData.documentType === 'cpf' ? 'Nome completo é obrigatório' : 'Razão social é obrigatória';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Deve ter pelo menos 3 caracteres';
    }
    
    // Document
    const docDigits = formData.documentValue.replace(/\D/g, '');
    if (!docDigits) {
      newErrors.documentValue = formData.documentType === 'cpf' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
    } else if (formData.documentType === 'cpf') {
      if (!validateCPF(docDigits)) newErrors.documentValue = 'CPF inválido';
    } else {
      if (!validateCNPJ(docDigits)) newErrors.documentValue = 'CNPJ inválido';
    }
    
    // Trade name for CNPJ
    if (formData.documentType === 'cnpj' && !formData.tradeName.trim()) {
      newErrors.tradeName = 'Nome fantasia é obrigatório para PJ';
    }
    
    // Birth date for CPF
    if (formData.documentType === 'cpf') {
      if (!formData.birthDate) {
        newErrors.birthDate = 'Data de nascimento é obrigatória';
      } else {
        const birthValidation = validateBirthDate(new Date(formData.birthDate));
        if (!birthValidation.valid) {
          newErrors.birthDate = birthValidation.message;
        }
      }
    }
    
    // Phone
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Telefone inválido';
    }
    
    // Workspace name
    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Nome do workspace é obrigatório';
    } else if (formData.workspaceName.trim().length < 2) {
      newErrors.workspaceName = 'Deve ter pelo menos 2 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    
    setLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        let message = "Erro ao fazer login";
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou senha incorretos";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Por favor, confirme seu email antes de fazer login";
        }
        toast({ title: "Erro de autenticação", description: message, variant: "destructive" });
      } else {
        toast({ title: "Login realizado", description: "Bem-vindo ao sistema!" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    
    setMode('validating');
    setLoading(true);
    
    try {
      // Step 1: Validate document via edge function
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-document', {
        body: {
          documentType: formData.documentType,
          documentValue: formData.documentValue.replace(/\D/g, ''),
          name: formData.name
        }
      });
      
      if (validationError) {
        throw new Error('Erro ao validar documento. Tente novamente.');
      }
      
      if (!validationData?.valid) {
        toast({ 
          title: "Documento inválido", 
          description: validationData?.error || 'Verifique os dados informados.', 
          variant: "destructive" 
        });
        setMode('register');
        setLoading(false);
        return;
      }
      
      // Step 2: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({ 
            title: "Email já cadastrado", 
            description: "Este email já está registrado. Tente fazer login.", 
            variant: "destructive" 
          });
          setMode('login');
          setLoginEmail(formData.email);
        } else {
          toast({ title: "Erro ao criar conta", description: authError.message, variant: "destructive" });
          setMode('register');
        }
        setLoading(false);
        return;
      }
      
      if (!authData.user) {
        toast({ title: "Erro", description: "Falha ao criar usuário", variant: "destructive" });
        setMode('register');
        setLoading(false);
        return;
      }
      
      // Step 3: Call RPC to create internal user and workspace
      const { data: rpcResult, error: rpcError } = await supabase.rpc('register_first_user', {
        p_email: formData.email,
        p_name: formData.name,
        p_phone: formData.phone.replace(/\D/g, ''),
        p_document_type: formData.documentType,
        p_document_value: formData.documentValue.replace(/\D/g, ''),
        p_trade_name: formData.documentType === 'cnpj' ? formData.tradeName : null,
        p_birth_date: formData.documentType === 'cpf' && formData.birthDate ? formData.birthDate : null,
        p_workspace_name: formData.workspaceName.trim()
      });
      
      if (rpcError) {
        console.error('RPC Error:', rpcError);
        
        let errorMessage = "Erro ao completar cadastro";
        if (rpcError.message.includes("Documento já cadastrado")) {
          errorMessage = "Este documento já está cadastrado no sistema";
        } else if (rpcError.message.includes("já possui cadastro")) {
          errorMessage = "Este usuário já possui cadastro completo";
        }
        
        toast({ 
          title: "Erro no cadastro", 
          description: errorMessage, 
          variant: "destructive" 
        });
        setMode('register');
        setLoading(false);
        return;
      }
      
      // Success!
      setMode('success');
      toast({ 
        title: "Cadastro realizado com sucesso!", 
        description: "Bem-vindo ao sistema!" 
      });
      
      // Force page reload to reinitialize all hooks
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ 
        title: "Erro", 
        description: error.message || "Ocorreu um erro inesperado", 
        variant: "destructive" 
      });
      setMode('register');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'documentValue') {
      const clean = value.replace(/\D/g, '');
      if (formData.documentType === 'cpf') {
        formattedValue = formatCPF(clean);
      } else {
        formattedValue = formatCNPJ(clean);
      }
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleDocumentTypeChange = (value: 'cpf' | 'cnpj') => {
    setFormData(prev => ({
      ...prev,
      documentType: value,
      documentValue: '',
      tradeName: '',
      birthDate: ''
    }));
    setErrors({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' && 'Entrar'}
            {mode === 'register' && 'Criar Conta'}
            {mode === 'validating' && 'Validando...'}
            {mode === 'success' && 'Cadastro Concluído!'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Acesse sua conta para gerenciar suas finanças'}
            {mode === 'register' && 'Preencha todos os dados para criar sua conta'}
            {mode === 'validating' && 'Validando seu documento junto à Receita Federal...'}
            {mode === 'success' && 'Seu workspace está pronto!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Entrar
              </Button>
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Não tem uma conta?
                </p>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setMode('register'); setErrors({}); }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar conta
                </Button>
              </div>
            </form>
          )}
          
          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => { setMode('login'); setErrors({}); }}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao login
              </Button>
              
              {/* Email & Password */}
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirmar *</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</p>}
                </div>
              </div>
              
              {/* Document Type */}
              <div className="space-y-3">
                <Label>Tipo de Pessoa *</Label>
                <RadioGroup 
                  value={formData.documentType} 
                  onValueChange={(v) => handleDocumentTypeChange(v as 'cpf' | 'cnpj')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 flex-1 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="cpf" id="cpf" />
                    <Label htmlFor="cpf" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Pessoa Física
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="cnpj" id="cnpj" />
                    <Label htmlFor="cnpj" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4" />
                      Pessoa Jurídica
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="reg-name">{formData.documentType === 'cpf' ? 'Nome Completo' : 'Razão Social'} *</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder={formData.documentType === 'cpf' ? 'Seu nome completo' : 'Razão social da empresa'}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
              </div>
              
              {/* Trade Name (CNPJ only) */}
              {formData.documentType === 'cnpj' && (
                <div className="space-y-2">
                  <Label htmlFor="reg-tradename">Nome Fantasia *</Label>
                  <Input
                    id="reg-tradename"
                    type="text"
                    placeholder="Nome fantasia da empresa"
                    value={formData.tradeName}
                    onChange={(e) => handleInputChange('tradeName', e.target.value)}
                    className={errors.tradeName ? "border-destructive" : ""}
                  />
                  {errors.tradeName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.tradeName}</p>}
                </div>
              )}
              
              {/* Document */}
              <div className="space-y-2">
                <Label htmlFor="reg-document">{formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'} *</Label>
                <Input
                  id="reg-document"
                  type="text"
                  placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={formData.documentValue}
                  onChange={(e) => handleInputChange('documentValue', e.target.value)}
                  className={errors.documentValue ? "border-destructive" : ""}
                  maxLength={formData.documentType === 'cpf' ? 14 : 18}
                />
                {errors.documentValue && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.documentValue}</p>}
              </div>
              
              {/* Birth Date (CPF only) */}
              {formData.documentType === 'cpf' && (
                <div className="space-y-2">
                  <Label htmlFor="reg-birthdate">Data de Nascimento *</Label>
                  <Input
                    id="reg-birthdate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className={errors.birthDate ? "border-destructive" : ""}
                  />
                  {errors.birthDate && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.birthDate}</p>}
                </div>
              )}
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Telefone *</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                  maxLength={15}
                />
                {errors.phone && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
              </div>
              
              {/* Workspace Name */}
              <div className="space-y-2">
                <Label htmlFor="reg-workspace">Nome do Workspace (Empresa/Projeto) *</Label>
                <Input
                  id="reg-workspace"
                  type="text"
                  placeholder="Ex: Minha Empresa"
                  value={formData.workspaceName}
                  onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                  className={errors.workspaceName ? "border-destructive" : ""}
                />
                {errors.workspaceName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.workspaceName}</p>}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Criar Conta
              </Button>
            </form>
          )}
          
          {/* VALIDATING */}
          {mode === 'validating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando seu documento junto à Receita Federal...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
            </div>
          )}
          
          {/* SUCCESS */}
          {mode === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">Cadastro realizado com sucesso!</p>
              <p className="text-muted-foreground">Redirecionando para o sistema...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
