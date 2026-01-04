import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInternalUser } from '@/hooks/useInternalUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building2, User, CheckCircle, AlertCircle } from 'lucide-react';
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
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  documentType: 'cpf' | 'cnpj';
  documentValue: string;
  tradeName: string;
  birthDate: string;
  phone: string;
  workspaceName: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  documentValue?: string;
  tradeName?: string;
  birthDate?: string;
  phone?: string;
  workspaceName?: string;
}

type Step = 'auth' | 'profile' | 'validating' | 'success';

export default function Cadastro() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { hasCompleteRegistration, loading: userLoading, refetch } = useInternalUser();
  
  const [step, setStep] = useState<Step>('auth');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    documentType: 'cpf',
    documentValue: '',
    tradeName: '',
    birthDate: '',
    phone: '',
    workspaceName: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirecionar se já tem cadastro completo
  useEffect(() => {
    if (!userLoading && hasCompleteRegistration) {
      navigate('/');
    }
  }, [hasCompleteRegistration, userLoading, navigate]);

  // Se já está autenticado mas não tem cadastro completo, pular para profile
  useEffect(() => {
    if (user && !hasCompleteRegistration && !userLoading) {
      setStep('profile');
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user, hasCompleteRegistration, userLoading]);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'E-mail inválido.';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória.';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = formData.documentType === 'cpf' ? 'Nome completo é obrigatório.' : 'Razão social é obrigatória.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres.';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido.';
    }
    
    if (!formData.documentValue.trim()) {
      newErrors.documentValue = formData.documentType === 'cpf' ? 'CPF é obrigatório.' : 'CNPJ é obrigatório.';
    } else {
      const cleanDoc = formData.documentValue.replace(/\D/g, '');
      if (formData.documentType === 'cpf') {
        if (!validateCPF(cleanDoc)) {
          newErrors.documentValue = 'CPF inválido. Verifique os dígitos.';
        }
      } else {
        if (!validateCNPJ(cleanDoc)) {
          newErrors.documentValue = 'CNPJ inválido. Verifique os dígitos.';
        }
      }
    }
    
    if (formData.documentType === 'cnpj' && !formData.tradeName.trim()) {
      newErrors.tradeName = 'Nome fantasia é obrigatório para PJ.';
    }
    
    if (formData.documentType === 'cpf') {
      if (!formData.birthDate) {
        newErrors.birthDate = 'Data de nascimento é obrigatória.';
      } else {
        const birthValidation = validateBirthDate(new Date(formData.birthDate));
        if (!birthValidation.valid) {
          newErrors.birthDate = birthValidation.message;
        }
      }
    }
    
    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Nome do workspace é obrigatório.';
    } else if (formData.workspaceName.trim().length < 2) {
      newErrors.workspaceName = 'Nome do workspace deve ter pelo menos 2 caracteres.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;
    
    setLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este e-mail já está cadastrado. Faça login.');
          navigate('/auth');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('Conta criada! Complete seu cadastro abaixo.');
      setStep('profile');
    } catch (err: any) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!validateStep2()) return;
    
    setStep('validating');
    setLoading(true);
    
    try {
      // Camada 1 e 2: Validação do documento via edge function
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
        toast.error(validationData?.error || 'Documento inválido.');
        setStep('profile');
        setLoading(false);
        return;
      }
      
      // Registrar usuário completo via RPC
      const { data: registerData, error: registerError } = await supabase.rpc('register_first_user', {
        p_email: formData.email || user?.email,
        p_name: formData.name,
        p_phone: formData.phone.replace(/\D/g, ''),
        p_document_type: formData.documentType,
        p_document_value: formData.documentValue.replace(/\D/g, ''),
        p_trade_name: formData.documentType === 'cnpj' ? formData.tradeName : null,
        p_birth_date: formData.documentType === 'cpf' ? formData.birthDate : null,
        p_workspace_name: formData.workspaceName
      });
      
      if (registerError) {
        console.error('Register error:', registerError);
        throw new Error(registerError.message);
      }
      
      console.log('Registration successful:', registerData);
      setStep('success');
      toast.success('Cadastro realizado com sucesso!');
      
      // Recarregar dados do usuário e redirecionar forçando reload completo
      await refetch();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Erro ao completar cadastro.');
      setStep('profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Formatação automática
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
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setFormData(prev => ({
      ...prev,
      documentType: type,
      documentValue: '',
      tradeName: '',
      birthDate: ''
    }));
    setErrors({});
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === 'auth' && 'Criar Conta'}
            {step === 'profile' && 'Complete seu Cadastro'}
            {step === 'validating' && 'Validando...'}
            {step === 'success' && 'Cadastro Concluído!'}
          </CardTitle>
          <CardDescription>
            {step === 'auth' && 'Primeiro, crie sua conta de acesso'}
            {step === 'profile' && 'Preencha seus dados para completar o cadastro'}
            {step === 'validating' && 'Validando seu documento...'}
            {step === 'success' && 'Seu workspace está pronto!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Auth */}
          {step === 'auth' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleStep1Submit}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continuar
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <button 
                  className="text-primary hover:underline"
                  onClick={() => navigate('/auth')}
                >
                  Fazer login
                </button>
              </p>
            </div>
          )}
          
          {/* Step 2: Profile */}
          {step === 'profile' && (
            <div className="space-y-4">
              {/* Tipo de cadastro */}
              <div className="space-y-3">
                <Label>Tipo de cadastro</Label>
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
              
              {/* Nome / Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {formData.documentType === 'cpf' ? 'Nome Completo' : 'Razão Social'}
                </Label>
                <Input
                  id="name"
                  placeholder={formData.documentType === 'cpf' ? 'Seu nome completo' : 'Razão social da empresa'}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              {/* Nome Fantasia (PJ) */}
              {formData.documentType === 'cnpj' && (
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input
                    id="tradeName"
                    placeholder="Nome fantasia da empresa"
                    value={formData.tradeName}
                    onChange={(e) => handleInputChange('tradeName', e.target.value)}
                    className={errors.tradeName ? 'border-destructive' : ''}
                  />
                  {errors.tradeName && <p className="text-sm text-destructive">{errors.tradeName}</p>}
                </div>
              )}
              
              {/* CPF / CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="documentValue">
                  {formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
                </Label>
                <Input
                  id="documentValue"
                  placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={formData.documentValue}
                  onChange={(e) => handleInputChange('documentValue', e.target.value)}
                  className={errors.documentValue ? 'border-destructive' : ''}
                  maxLength={formData.documentType === 'cpf' ? 14 : 18}
                />
                {errors.documentValue && <p className="text-sm text-destructive">{errors.documentValue}</p>}
              </div>
              
              {/* Data de Nascimento (PF) */}
              {formData.documentType === 'cpf' && (
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className={errors.birthDate ? 'border-destructive' : ''}
                  />
                  {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
                </div>
              )}
              
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                  maxLength={15}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              
              {/* Nome do Workspace */}
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Nome do Workspace (Empresa/Projeto)</Label>
                <Input
                  id="workspaceName"
                  placeholder="Ex: Minha Empresa"
                  value={formData.workspaceName}
                  onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                  className={errors.workspaceName ? 'border-destructive' : ''}
                />
                {errors.workspaceName && <p className="text-sm text-destructive">{errors.workspaceName}</p>}
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleStep2Submit}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Finalizar Cadastro
              </Button>
            </div>
          )}
          
          {/* Validating */}
          {step === 'validating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando seu documento junto à Receita Federal...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
            </div>
          )}
          
          {/* Success */}
          {step === 'success' && (
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
}
