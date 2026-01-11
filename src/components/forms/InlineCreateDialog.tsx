import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ, formatCPF, formatPhone } from "@/utils/documentValidation";

interface InlineCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'fornecedor' | 'cliente' | 'categoria_entrada' | 'categoria_saida' | 'centro_custo';
  onSuccess: (newId: string) => void;
}

export const InlineCreateDialog = ({ 
  open, 
  onOpenChange, 
  type, 
  onSuccess 
}: InlineCreateDialogProps) => {
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    descricao: ''
  });

  const resetForm = () => {
    setFormData({ nome: '', documento: '', email: '', telefone: '', descricao: '' });
  };

  const getTitle = () => {
    switch (type) {
      case 'fornecedor': return 'Novo Fornecedor';
      case 'cliente': return 'Novo Cliente';
      case 'categoria_entrada': return 'Nova Categoria de Entrada';
      case 'categoria_saida': return 'Nova Categoria de Saída';
      case 'centro_custo': return 'Novo Centro de Custo';
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o nome.",
        variant: "destructive"
      });
      return;
    }

    if (!workspaceId) {
      toast({
        title: "Erro",
        description: "Workspace não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let newId: string | null = null;

      if (type === 'fornecedor') {
        const { data, error } = await supabase
          .from('fornecedores')
          .insert({
            nome: formData.nome,
            documento: formData.documento || null,
            tipo_documento: formData.documento.length === 14 ? 'cnpj' : formData.documento.length === 11 ? 'cpf' : null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            workspace_id: workspaceId,
            ativo: true
          })
          .select('id')
          .single();
        
        if (error) throw error;
        newId = data.id;
      } 
      else if (type === 'cliente') {
        const { data, error } = await supabase
          .from('clientes')
          .insert({
            nome: formData.nome,
            contato: formData.telefone || formData.email || null,
            workspace_id: workspaceId
          })
          .select('id')
          .single();
        
        if (error) throw error;
        newId = data.id;
      }
      else if (type === 'categoria_entrada' || type === 'categoria_saida') {
        const { data, error } = await supabase
          .from('categorias')
          .insert({
            nome: formData.nome,
            tipo: type === 'categoria_entrada' ? 'entrada' : 'saida',
            workspace_id: workspaceId
          })
          .select('id')
          .single();
        
        if (error) throw error;
        newId = data.id;
      }
      else if (type === 'centro_custo') {
        const { data, error } = await supabase
          .from('centros_custo')
          .insert({
            nome: formData.nome,
            descricao: formData.descricao || null,
            workspace_id: workspaceId,
            ativo: true
          })
          .select('id')
          .single();
        
        if (error) throw error;
        newId = data.id;
      }

      if (newId) {
        toast({
          title: "✓ Cadastro realizado",
          description: `${formData.nome} foi adicionado com sucesso.`
        });
        resetForm();
        onOpenChange(false);
        onSuccess(newId);
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentoChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    
    if (type === 'fornecedor' && digits.length <= 14) {
      formatted = digits.length > 11 ? formatCNPJ(digits) : formatCPF(digits);
    } else if (type === 'cliente' && digits.length <= 14) {
      formatted = digits.length > 11 ? formatCNPJ(digits) : formatCPF(digits);
    }
    
    setFormData(prev => ({ ...prev, documento: formatted }));
  };

  const handleTelefoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = formatPhone(digits);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder={type === 'centro_custo' ? 'Ex: Administrativo' : 'Nome completo'}
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              autoFocus
            />
          </div>

          {(type === 'fornecedor' || type === 'cliente') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  placeholder="000.000.000-00"
                  value={formData.documento}
                  onChange={(e) => handleDocumentoChange(e.target.value)}
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  maxLength={15}
                />
              </div>
            </>
          )}

          {type === 'centro_custo' && (
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Descrição do centro de custo"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
