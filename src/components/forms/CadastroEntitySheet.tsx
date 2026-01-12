import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export type EntityType = 
  | "fornecedor" 
  | "cliente" 
  | "categoria_entrada" 
  | "categoria_saida" 
  | "centro_custo";

interface CadastroEntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  editingItem?: any;
  onSuccess: () => void;
}

const entityConfig = {
  fornecedor: {
    title: "Fornecedor",
    table: "fornecedores",
    fields: [
      { name: "nome", label: "Nome *", type: "text", required: true },
      { name: "documento", label: "CNPJ/CPF", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "endereco", label: "Endereço", type: "text" },
    ],
    hasAtivo: true,
  },
  cliente: {
    title: "Cliente",
    table: "clientes",
    fields: [
      { name: "nome", label: "Nome *", type: "text", required: true },
      { name: "documento", label: "CPF/CNPJ", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "contato", label: "Observações", type: "text" },
    ],
    hasAtivo: true,
  },
  categoria_entrada: {
    title: "Categoria de Entrada",
    table: "categorias",
    fields: [
      { name: "nome", label: "Nome *", type: "text", required: true },
      { name: "cor", label: "Cor", type: "color", defaultValue: "#22C55E" },
    ],
    extraData: { tipo: "entrada" },
  },
  categoria_saida: {
    title: "Categoria de Saída",
    table: "categorias",
    fields: [
      { name: "nome", label: "Nome *", type: "text", required: true },
      { name: "cor", label: "Cor", type: "color", defaultValue: "#EF4444" },
    ],
    extraData: { tipo: "saida" },
  },
  centro_custo: {
    title: "Centro de Custo",
    table: "centros_custo",
    fields: [
      { name: "nome", label: "Nome *", type: "text", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
    ],
    hasAtivo: true,
  },
};

const CadastroEntitySheet = ({
  open,
  onOpenChange,
  entityType,
  editingItem,
  onSuccess,
}: CadastroEntitySheetProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [ativo, setAtivo] = useState(true);

  const config = entityConfig[entityType];

  useEffect(() => {
    if (open) {
      if (editingItem) {
        // Preencher form com dados existentes
        const data: Record<string, any> = {};
        config.fields.forEach((field) => {
          data[field.name] = editingItem[field.name] || "";
        });
        setFormData(data);
        setAtivo(editingItem.ativo !== false);
      } else {
        // Reset form para novo cadastro
        const data: Record<string, any> = {};
        config.fields.forEach((field) => {
          data[field.name] = (field as any).defaultValue || "";
        });
        setFormData(data);
        setAtivo(true);
      }
    }
  }, [open, editingItem, entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    const requiredFields = config.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]?.trim()) {
        toast({
          title: "Campo obrigatório",
          description: `O campo "${field.label.replace(" *", "")}" é obrigatório.`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Obter workspace_id do usuário
      const { data: userData, error: userError } = await supabase.rpc(
        "get_user_workspace_id"
      );

      if (userError) throw userError;

      const workspaceId = userData;

      if (!workspaceId) {
        throw new Error("Workspace não encontrado");
      }

      // Preparar dados
      const saveData: Record<string, any> = {
        ...formData,
        workspace_id: workspaceId,
      };

      // Adicionar dados extras (ex: tipo para categorias)
      if ((config as any).extraData) {
        Object.assign(saveData, (config as any).extraData);
      }

      // Adicionar ativo se a tabela suporta (agora inclui clientes)
      if ((config as any).hasAtivo !== false) {
        saveData.ativo = ativo;
      }

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from(config.table as any)
          .update(saveData as any)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Atualizado!",
          description: `${config.title} atualizado com sucesso.`,
        });
      } else {
        // Insert
        const { error } = await supabase
          .from(config.table as any)
          .insert(saveData as any);

        if (error) throw error;

        toast({
          title: "Cadastrado!",
          description: `${config.title} cadastrado com sucesso.`,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {editingItem ? `Editar ${config.title}` : `Novo ${config.title}`}
          </SheetTitle>
          <SheetDescription>
            {editingItem
              ? `Atualize os dados do ${config.title.toLowerCase()}`
              : `Preencha os dados para cadastrar um novo ${config.title.toLowerCase()}`}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase().replace(" *", "")}`}
                />
              ) : field.type === "color" ? (
                <div className="flex items-center gap-2">
                  <Input
                    id={field.name}
                    type="color"
                    value={formData[field.name] || (field as any).defaultValue || "#000000"}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData[field.name] || (field as any).defaultValue || "#000000"}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="flex-1"
                    placeholder="#RRGGBB"
                  />
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase().replace(" *", "")}`}
                />
              )}
            </div>
          ))}

          {/* Status Ativo */}
          {editingItem && (config as any).hasAtivo !== false && (
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="ativo">Status Ativo</Label>
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CadastroEntitySheet;
