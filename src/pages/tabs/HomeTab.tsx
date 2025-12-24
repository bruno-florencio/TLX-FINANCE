import { SaldosCaixaCard } from "@/components/home/SaldosCaixaCard";
import { ContasPagarCard } from "@/components/home/ContasPagarCard";
import { ContasReceberCard } from "@/components/home/ContasReceberCard";
import { FluxoCaixaCard } from "@/components/home/FluxoCaixaCard";
import { CartoesCredito } from "@/components/home/CartoesCredito";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HomeTab = () => {
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header - Minimal */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{dataFormatada}</p>
        </div>
      </div>

      {/* Layout principal em grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Coluna esquerda: Saldos, Contas a Pagar, Contas a Receber */}
        <div className="xl:col-span-3 space-y-5">
          {/* Primeira linha: Saldos de Caixa */}
          <SaldosCaixaCard />

          {/* Segunda linha: Contas a Pagar e Receber */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
