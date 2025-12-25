import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { bancosUnicos, bandeirasCartao, tiposConta } from "@/data/bancosBrasileiros";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NovaContaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingConta?: {
    id: string;
    nome: string;
    tipo: string;
    banco?: string;
    agencia?: string;
    numero_conta?: string;
    saldo_inicial: number;
  } | null;
}

const NovaContaSheet = ({ open, onOpenChange, onSuccess, editingConta }: NovaContaSheetProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "corrente",
    banco: "",
    bandeira: "",
    agencia: "",
    numero_conta: "",
    saldo_inicial: 0,
    limite_credito: 0,
    dia_fechamento: 1,
    dia_vencimento: 10,
  });

  useEffect(() => {
    if (editingConta) {
      setFormData({
        nome: editingConta.nome,
        tipo: editingConta.tipo,
        banco: editingConta.banco || "",
        bandeira: "",
        agencia: editingConta.agencia || "",
        numero_conta: editingConta.numero_conta || "",
        saldo_inicial: editingConta.saldo_inicial,
        limite_credito: 0,
        dia_fechamento: 1,
        dia_vencimento: 10,
      });
    } else {
      setFormData({
        nome: "",
        tipo: "corrente",
        banco: "",
        bandeira: "",
        agencia: "",
        numero_conta: "",
        saldo_inicial: 0,
        limite_credito: 0,
        dia_fechamento: 1,
        dia_vencimento: 10,
      });
    }
  }, [editingConta, open]);

  const isCartaoCredito = formData.tipo === "cartao_credito";

  const bancoSelecionado = bancosUnicos.find(b => b.codigo === formData.banco);
  const bandeiraSelecionada = bandeirasCartao.find(b => b.id === formData.bandeira);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nomeCompleto = isCartaoCredito 
        ? `${formData.nome} (${bandeiraSelecionada?.nome || ""})`
        : formData.nome;

      const contaData = {
        nome: nomeCompleto,
        tipo: formData.tipo,
        banco: bancoSelecionado?.nome || formData.banco,
        agencia: isCartaoCredito ? null : formData.agencia,
        numero_conta: formData.numero_conta,
        saldo_inicial: isCartaoCredito ? -formData.limite_credito : formData.saldo_inicial,
        ativo: true,
      };

      if (editingConta) {
        const { error } = await supabase
          .from("contas_bancarias")
          .update(contaData)
          .eq("id", editingConta.id);

        if (error) throw error;

        toast({
          title: "Conta atualizada",
          description: "Conta atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("contas_bancarias")
          .insert([contaData]);

        if (error) throw error;

        toast({
          title: "Conta cadastrada",
          description: "Nova conta cadastrada com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar conta:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {editingConta ? "Editar Conta" : "Nova Conta Bancária / Cartão"}
          </SheetTitle>
          <SheetDescription>
            Cadastre uma conta corrente, poupança ou cartão de crédito.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Tipo de Conta */}
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {tiposConta.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    <span className="flex items-center gap-2">
                      <span>{tipo.icone}</span>
                      <span>{tipo.nome}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Banco */}
          <div className="space-y-2">
            <Label>Banco / Instituição</Label>
            <Select
              value={formData.banco}
              onValueChange={(value) => setFormData({ ...formData, banco: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco">
                  {bancoSelecionado && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold"
                        style={{ 
                          backgroundColor: bancoSelecionado.cor,
                          color: bancoSelecionado.corTexto
                        }}
                      >
                        {bancoSelecionado.codigo}
                      </div>
                      <span>{bancoSelecionado.nome}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50 max-h-[300px]">
                <ScrollArea className="h-[280px]">
                  {bancosUnicos.map((banco) => (
                    <SelectItem key={banco.codigo} value={banco.codigo}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold shrink-0"
                          style={{ 
                            backgroundColor: banco.cor,
                            color: banco.corTexto
                          }}
                        >
                          {banco.codigo}
                        </div>
                        <span className="truncate">{banco.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Bandeira do Cartão (somente para cartão de crédito) */}
          {isCartaoCredito && (
            <div className="space-y-2">
              <Label>Bandeira do Cartão</Label>
              <Select
                value={formData.bandeira}
                onValueChange={(value) => setFormData({ ...formData, bandeira: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a bandeira">
                    {bandeiraSelecionada && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-5 rounded flex items-center justify-center text-[8px] font-bold"
                          style={{ 
                            backgroundColor: bandeiraSelecionada.cor,
                            color: bandeiraSelecionada.corTexto
                          }}
                        >
                          {bandeiraSelecionada.nome.substring(0, 4).toUpperCase()}
                        </div>
                        <span>{bandeiraSelecionada.nome}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-[300px]">
                  <ScrollArea className="h-[280px]">
                    {bandeirasCartao.map((bandeira) => (
                      <SelectItem key={bandeira.id} value={bandeira.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0"
                            style={{ 
                              backgroundColor: bandeira.cor,
                              color: bandeira.corTexto
                            }}
                          >
                            {bandeira.nome.substring(0, 4).toUpperCase()}
                          </div>
                          <span>{bandeira.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nome da Conta */}
          <div className="space-y-2">
            <Label>Nome / Apelido da Conta</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder={isCartaoCredito ? "Ex: Cartão Nubank" : "Ex: Conta Principal"}
              required
            />
          </div>

          {/* Agência (não para cartão) */}
          {!isCartaoCredito && (
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="0000-0"
              />
            </div>
          )}

          {/* Número da Conta / Últimos 4 dígitos */}
          <div className="space-y-2">
            <Label>{isCartaoCredito ? "Últimos 4 dígitos do cartão" : "Número da Conta"}</Label>
            <Input
              value={formData.numero_conta}
              onChange={(e) => setFormData({ ...formData, numero_conta: e.target.value })}
              placeholder={isCartaoCredito ? "1234" : "00000-0"}
              maxLength={isCartaoCredito ? 4 : undefined}
            />
          </div>

          {/* Saldo Inicial ou Limite */}
          {isCartaoCredito ? (
            <>
              <div className="space-y-2">
                <Label>Limite do Cartão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.limite_credito}
                  onChange={(e) => setFormData({ ...formData, limite_credito: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia do Fechamento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_fechamento}
                    onChange={(e) => setFormData({ ...formData, dia_fechamento: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldo_inicial}
                onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
          )}

          {/* Preview */}
          {(bancoSelecionado || bandeiraSelecionada) && (
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Prévia:</p>
              <div className="flex items-center gap-3">
                {bancoSelecionado && (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold shadow-md"
                    style={{ 
                      backgroundColor: bancoSelecionado.cor,
                      color: bancoSelecionado.corTexto
                    }}
                  >
                    {bancoSelecionado.codigo}
                  </div>
                )}
                {isCartaoCredito && bandeiraSelecionada && (
                  <div 
                    className="w-12 h-8 rounded flex items-center justify-center text-[10px] font-bold shadow-md"
                    style={{ 
                      backgroundColor: bandeiraSelecionada.cor,
                      color: bandeiraSelecionada.corTexto
                    }}
                  >
                    {bandeiraSelecionada.nome.substring(0, 4).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {formData.nome || (isCartaoCredito ? "Nome do Cartão" : "Nome da Conta")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bancoSelecionado?.nome}
                    {isCartaoCredito && bandeiraSelecionada && ` • ${bandeiraSelecionada.nome}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : editingConta ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NovaContaSheet;
