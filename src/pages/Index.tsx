import { useState } from "react";
import Header from "@/components/layout/Header";
import HomeTab from "./tabs/HomeTab";
import EntradasTab from "./tabs/EntradasTabEnhanced";
import SaidasTab from "./tabs/SaidasTabEnhanced";
import ExtratoTab from "./tabs/ExtratoTab";
import ContasTab from "./tabs/ContasTab";
import RelatoriosTab from "./tabs/RelatoriosTab";
import ConfiguracaoTab from "./tabs/ConfiguracaoTab";

const Index = () => {
  const [currentTab, setCurrentTab] = useState("home");

  const renderTabContent = () => {
    switch (currentTab) {
      case "home":
        return <HomeTab />;
      case "entradas":
        return <EntradasTab />;
      case "saidas":
        return <SaidasTab />;
      case "extrato":
        return <ExtratoTab />;
      case "contas":
        return <ContasTab />;
      case "relatorios":
        return <RelatoriosTab />;
      case "configuracao":
        return <ConfiguracaoTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Index;
