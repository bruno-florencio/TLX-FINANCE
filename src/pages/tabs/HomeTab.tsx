import { SaldosCaixaCard } from "@/components/home/SaldosCaixaCard";
import { ContasPagarCard } from "@/components/home/ContasPagarCard";
import { ContasReceberCard } from "@/components/home/ContasReceberCard";
import { FluxoCaixaCard } from "@/components/home/FluxoCaixaCard";
import { CartoesCredito } from "@/components/home/CartoesCredito";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HomeTab = () => {
  const dataAtual = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground font-american-captain tracking-wide">
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground capitalize">{dataAtual}</p>
      </div>

      {/* Layout principal em grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Coluna esquerda: Saldos, Contas a Pagar, Contas a Receber */}
        <div className="xl:col-span-3 space-y-6">
          {/* Primeira linha: Saldos de Caixa */}
          <SaldosCaixaCard />

          {/* Segunda linha: Contas a Pagar e Receber */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContasPagarCard />
            <ContasReceberCard />
          </div>

          {/* Terceira linha: Gráfico de Fluxo de Caixa */}
          <FluxoCaixaCard />
        </div>

        {/* Coluna direita: Cartões de Crédito */}
        <div className="xl:col-span-1">
          <CartoesCredito />
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
