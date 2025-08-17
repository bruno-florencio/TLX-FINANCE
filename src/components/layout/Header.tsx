import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Settings,
  Menu,
  X
} from "lucide-react";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ currentTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "entradas", label: "Entradas", icon: TrendingUp },
    { id: "saidas", label: "Saídas", icon: TrendingDown },
    { id: "contas", label: "Contas e Extratos", icon: FileText },
    { id: "relatorios", label: "Relatórios", icon: FileText },
    { id: "configuracao", label: "Configuração", icon: Settings },
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-american-captain text-primary-foreground">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-american-captain text-primary">H MOLINA</h1>
              <p className="text-sm text-muted-foreground">Sistema Financeiro</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={currentTab === tab.id ? "default" : "ghost"}
                  onClick={() => onTabChange(tab.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border mt-2 pt-4">
            <div className="flex flex-col space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={currentTab === tab.id ? "default" : "ghost"}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-start space-x-2 w-full"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;