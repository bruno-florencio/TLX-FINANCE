import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardBrandLogo } from "@/components/ui/BankLogo";
import { addMonths, format, startOfMonth, endOfMonth, parseISO } from "date-fns";
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

          // Fatura atual (mês atual)
          const faturaAtual = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioMesAtual && data <= fimMesAtual;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          // Próxima fatura (próximo mês)
          const proximaFaturaValor = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioProximoMes && data <= fimProximoMes;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          // Última fatura (mês anterior)
          const ultimaFatura = lancamentosCartao
            .filter((l) => {
              const data = new Date(l.data_vencimento);
              return data >= inicioMesAnterior && data <= fimMesAnterior;
            })
            .reduce((sum, l) => sum + Number(l.valor), 0);

          // Pagamentos agendados (pendentes do cartão)
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
              data: new Date(proximoMes.getFullYear(), proximoMes.getMonth(), 10), // Assume dia 10
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
    <Card className="h-molina-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-accent" />
          <span>Cartões de Crédito</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : cartoes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartoes.map((cartao) => (
              <div
                key={cartao.id}
                className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 border border-border space-y-3"
              >
                {/* Header do cartão */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardBrandLogo brandId={cartao.bandeira || "default"} size="md" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {cartao.nome}
                      </h4>
                      {cartao.banco && (
                        <span className="text-xs text-muted-foreground">
                          {cartao.banco}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-accent/20 text-accent-foreground border-accent/30">
                    Limite: {formatCurrency(cartao.limite)}
                  </Badge>
                </div>

                {/* Informações do cartão */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Próxima fatura */}
                  <div className="p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>Próxima Fatura</span>
                    </div>
                    <div className={`font-semibold ${cartao.proximaFatura.valor > 0 ? "text-saida" : "text-muted-foreground"}`}>
                      {cartao.proximaFatura.valor > 0
                        ? formatCurrency(cartao.proximaFatura.valor)
                        : "Sem lançamentos"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vencimento: {format(cartao.proximaFatura.data, "dd/MM/yyyy")}
                    </div>
                  </div>

                  {/* Última fatura */}
                  <div className="p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>Última Fatura</span>
                    </div>
                    <div className={`font-semibold ${cartao.ultimaFatura > 0 ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      {cartao.ultimaFatura > 0
                        ? formatCurrency(cartao.ultimaFatura)
                        : "Sem fatura"}
                    </div>
                  </div>

                  {/* Limite disponível */}
                  <div className="p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Wallet className="w-3 h-3" />
                      <span>Limite Disponível</span>
                    </div>
                    <div className={`font-semibold ${getValueColor(cartao.limiteDisponivel)}`}>
                      {formatCurrency(cartao.limiteDisponivel)}
                    </div>
                  </div>

                  {/* Pagamentos agendados */}
                  <div className="p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Pagamentos Agendados</span>
                    </div>
                    <div className={`font-semibold ${cartao.pagamentosAgendados > 0 ? "text-pendente" : "text-muted-foreground"}`}>
                      {cartao.pagamentosAgendados > 0
                        ? formatCurrency(cartao.pagamentosAgendados)
                        : "Nenhum"}
                    </div>
                  </div>
                </div>

                {/* Disponível após pagamento */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Disponível após pagamento da fatura:
                    </span>
                    <span className={`font-bold ${getValueColor(cartao.disponivelAposPagamento)}`}>
                      {formatCurrency(cartao.disponivelAposPagamento)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
