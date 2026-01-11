import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InlineCreateDialog } from "./InlineCreateDialog";

interface SelectOption {
  id: string;
  nome: string;
}

interface SelectWithCreateProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  type: 'fornecedor' | 'cliente' | 'categoria_entrada' | 'categoria_saida' | 'centro_custo';
  onRefetch: () => void;
  disabled?: boolean;
}

export const SelectWithCreate = ({
  value,
  onValueChange,
  options,
  placeholder,
  type,
  onRefetch,
  disabled = false
}: SelectWithCreateProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = (newId: string) => {
    onRefetch();
    // Auto-select após criar
    setTimeout(() => {
      onValueChange(newId);
    }, 300);
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDialogOpen(true)}
        title={`Adicionar novo ${type.replace('_', ' ')}`}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <InlineCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={type}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
