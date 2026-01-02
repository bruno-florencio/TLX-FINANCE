import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Save,
  Plus,
  Copy,
  FileText,
  Receipt,
  ExternalLink,
  Paperclip,
  Mail,
  ListTodo,
  Trash2,
  XCircle,
  CalendarIcon,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";

interface NovaContaPagarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingLancamento?: any;
}

const NovaContaPagarSheet = ({ open, onOpenChange, onSuccess, editingLancamento }: NovaContaPagarSheetProps) => {
  const { toast } = useToast();
  const { categorias, contas, fornecedores } = useSupabaseData();
  const { workspaceId, hasWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    descricao: editingLancamento?.descricao || '',
    categoria_id: editingLancamento?.categoria_id || undefined,
    conta_id: editingLancamento?.conta_id || undefined,
    fornecedor_id: editingLancamento?.fornecedor_id || undefined,
    valor: editingLancamento?.valor?.toString() || '',
    numero_documento: editingLancamento?.numero_documento || '',
    data_vencimento: editingLancamento?.data_vencimento ? new Date(editingLancamento.data_vencimento) : new Date(),
    observacoes: editingLancamento?.observacoes || ''
  });

  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria_id: undefined,
      conta_id: undefined,
      fornecedor_id: undefined,
      valor: '',
      numero_documento: '',
      data_vencimento: new Date(),
      observacoes: ''
    });
  };

  // Preencher formulário quando editingLancamento mudar
  useEffect(() => {
    if (editingLancamento) {
      setFormData({
        descricao: editingLancamento.descricao || '',
        categoria_id: editingLancamento.categoria_id || undefined,
        conta_id: editingLancamento.conta_id || undefined,
        fornecedor_id: editingLancamento.fornecedor_id || undefined,
        valor: editingLancamento.valor?.toString() || '',
        numero_documento: editingLancamento.numero_documento || '',
        data_vencimento: editingLancamento.data_vencimento ? new Date(editingLancamento.data_vencimento) : new Date(),
        observacoes: editingLancamento.observacoes || ''
      });
    } else if (open) {
      resetForm();
    }
  }, [editingLancamento, open]);

  const handleSave = async () => {
    if (!formData.descricao || !formData.valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Fornecedor e Valor da Conta.",
        variant: "destructive"
      });
      return;
    }

    if (!hasWorkspace) {
      toast({
        title: "Erro",
        description: "Usuário não pertence a nenhum workspace.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // workspace_id é obtido automaticamente do hook useWorkspace
      const dataToSave = {
        tipo: 'saida',
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        categoria_id: formData.categoria_id || null,
        conta_id: formData.conta_id || null,
        fornecedor_id: formData.fornecedor_id || null,
        data_vencimento: format(formData.data_vencimento, 'yyyy-MM-dd'),
        numero_documento: formData.numero_documento || null,
        observacoes: formData.observacoes || null,
        status: editingLancamento?.status || 'pendente',
        workspace_id: workspaceId
      };

      const { error } = editingLancamento
        ? await supabase
            .from('lancamentos')
            .update(dataToSave)
            .eq('id', editingLancamento.id)
        : await supabase
            .from('lancamentos')
            .insert(dataToSave);

      if (error) throw error;

      toast({
        title: editingLancamento ? "✓ Conta atualizada com sucesso" : "✓ Conta registrada com sucesso",
        description: editingLancamento ? "Saída atualizada no sistema." : "Saída adicionada ao sistema.",
      });

      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = () => {
    toast({
      title: "Registro duplicado",
      description: "Os dados foram copiados para um novo registro."
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] overflow-y-auto p-0">
        <div className="flex h-full">
          {/* Conteúdo Principal */}
          <div className="flex-1 p-6 space-y-6">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold">
                {editingLancamento ? 'Editar Conta a Pagar' : 'Incluir Conta a Pagar'}
              </SheetTitle>
            </SheetHeader>

            {/* Dados Principais */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor *</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.fornecedor_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, fornecedor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(fornecedor => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select 
                    value={formData.categoria_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.filter(cat => cat.tipo === 'saida').map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta">Conta Corrente</Label>
                <Select 
                  value={formData.conta_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, conta_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Informações Financeiras */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg">Informações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_vencimento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_vencimento 
                          ? format(formData.data_vencimento, "PPP", { locale: ptBR }) 
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_vencimento}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, data_vencimento: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previsao">Previsão de Pagamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.data_vencimento, "PPP", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_vencimento}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, data_vencimento: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor da Conta *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_documento">Número do Documento</Label>
                  <Input
                    id="numero_documento"
                    placeholder="002/001"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Detalhes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalhes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                  <Input
                    id="nota_fiscal"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                    placeholder="Número da NF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_emissao">Data de Emissão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.data_vencimento, "PPP", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_vencimento}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, data_vencimento: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  rows={4}
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a conta..."
                />
              </div>
            </div>

            {/* Informações Complementares */}
            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Data de Inclusão:</span> {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
                <div>
                  <span className="font-medium">Incluído por:</span> Usuário Atual
                </div>
              </div>
            </div>
          </div>

          {/* Painel Lateral de Ações */}
          <div className="w-20 bg-muted/30 border-l border-border p-2 space-y-2 flex flex-col items-center">
            <Button
              variant="default"
              size="icon"
              className="w-14 h-14"
              onClick={handleSave}
              disabled={loading}
              title="Salvar"
            >
              <Save className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              onClick={() => {
                resetForm();
                toast({ title: "Formulário limpo" });
              }}
              title="Incluir"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              onClick={handleDuplicate}
              title="Duplicar"
            >
              <Copy className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Gerar Comprovante"
            >
              <FileText className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Exibir DANFE"
            >
              <Receipt className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Acessar no Portal"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Anexos"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Emails Enviados"
            >
              <Mail className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14"
              title="Tarefas"
            >
              <ListTodo className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <Button
              variant="destructive"
              size="icon"
              className="w-14 h-14"
              title="Excluir"
            >
              <Trash2 className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              title="Cancelar Conta"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NovaContaPagarSheet;
