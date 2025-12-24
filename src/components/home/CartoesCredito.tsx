import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardBrandLogo } from "@/components/ui/BankLogo";
import { addMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CartaoCredito {
  id: string;
  nome: string;
  banco?: string | null;
  bandeira?: string | null;
  limite: number;
  saldo_atual: number;
}

interface CartaoComFatura extends CartaoCredito {
  faturaAtual: number;
  proximaFatura: {
    valor: number;
    data: Date;
  };
  ultimaFatura: number;
  pagamentosAgendados: number;
  limiteDisponivel: number;
  disponivelAposPagamento: number;
}

export const CartoesCredito = () => {
  const [cartoes, setCartoes] = useState<CartaoComFatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartoes();
  }, []);

  const fetchCartoes = async () => {
    try {
      setLoading(true);

      const [cartoesRes, lancamentosRes] = await Promise.all([
        supabase
          .from("contas")
          .select("*")
          .eq("tipo", "cartao_credito")
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("lancamentos")
          .select("*")
          .eq("tipo", "saida")
          .order("data_vencimento"),
      ]);

      if (cartoesRes.error) throw cartoesRes.error;
      if (lancamentosRes.error) throw lancamentosRes.error;

      const hoje = new Date();
      const inicioMesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      const proximoMes = addMonths(hoje, 1);
      const inicioProximoMes = startOfMonth(proximoMes);
      const fimProximoMes = endOfMonth(proximoMes);
      const mesAnterior = addMonths(hoje, -1);
      const inicioMesAnterior = startOfMonth(mesAnterior);
      const fimMesAnterior = endOfMonth(mesAnterior);

      const cartoesFormatados: CartaoComFatura[] = (cartoesRes.data || []).map(
        (cartao) => {
          const lancamentosCartao = (lancamentosRes.data || []).filter(
            (l) => l.conta_id === cartao.id
          );

          const faturaAtual = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioMesAtual && data <= fimMesAtual;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          const proximaFaturaValor = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioProximoMes && data <= fimProximoMes;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          const ultimaFatura = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioMesAnterior && data <= fimMesAnterior;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          const pagamentosAgendados = lancamentosCartao
            .filter((l) => l.status === "pendente")
            .reduce((sum, l) => sum + Number(l.valor), 0);

          const limite = Number(cartao.limite) || 0;
          const limiteDisponivel = limite - faturaAtual - pagamentosAgendados;
          const disponivelAposPagamento = limite - pagamentosAgendados + faturaAtual;

          return {
            ...cartao,
            limite,
            faturaAtual,
            proximaFatura: {
              valor: proximaFaturaValor,
              data: new Date(proximoMes.getFullYear(), proximoMes.getMonth(), 10),
            },
            ultimaFatura,
            pagamentosAgendados,
            limiteDisponivel,
            disponivelAposPagamento,
          };
        }
      );

      setCartoes(cartoesFormatados);
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getValueColor = (value: number, inverted = false) => {
    if (inverted) {
      return value > 0 ? "text-saida" : "text-entrada";
    }
    return value >= 0 ? "text-entrada" : "text-saida";
  };

  return (
    <Card className="clean-card h-full">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold text-foreground">
            Cartões de Crédito
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : cartoes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartoes.map((cartao) => (
              <div
                key={cartao.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3"
              >
                {/* Header do cartão */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardBrandLogo brandId={cartao.bandeira || "default"} size="sm" />
                    <div>
                      <h4 className="font-medium text-sm text-foreground">
                        {cartao.nome}
                      </h4>
                      {cartao.banco && (
                        <span className="text-xs text-muted-foreground">
                          {cartao.banco}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Limite: {formatCurrency(cartao.limite)}
                  </span>
                </div>

                {/* Informações do cartão */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {/* Próxima fatura */}
                  <div className="p-2 rounded bg-card border border-border/40">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Próxima</span>
                    </div>
                    <div className={`font-semibold tabular-nums ${cartao.proximaFatura.valor > 0 ? "text-saida" : "text-muted-foreground"}`}>
                      {cartao.proximaFatura.valor > 0
                        ? formatCurrency(cartao.proximaFatura.valor)
                        : "—"}
                    </div>
                  </div>

                  {/* Limite disponível */}
                  <div className="p-2 rounded bg-card border border-border/40">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                      <Wallet className="w-3 h-3" />
                      <span>Disponível</span>
                    </div>
                    <div className={`font-semibold tabular-nums ${getValueColor(cartao.limiteDisponivel)}`}>
                      {formatCurrency(cartao.limiteDisponivel)}
                    </div>
                  </div>
                </div>

                {/* Disponível após pagamento */}
                {cartao.faturaAtual > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Após pagamento:
                      </span>
                      <span className={`font-semibold tabular-nums ${getValueColor(cartao.disponivelAposPagamento)}`}>
                        {formatCurrency(cartao.disponivelAposPagamento)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
