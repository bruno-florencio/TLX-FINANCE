import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Settings,
  Menu,
  X,
  Receipt,
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ currentTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "entradas", label: "Entradas", icon: TrendingUp },
    { id: "saidas", label: "Saídas", icon: TrendingDown },
    { id: "extrato", label: "Extrato", icon: Receipt },
    { id: "relatorios", label: "Relatórios", icon: FileText },
    { id: "configuracao", label: "Configuração", icon: Settings },
  ];

  return (
    <header className="bg-card border-b border-border/60 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className="flex items-center justify-between h-14">
          {/* Logo - Minimal */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">T</span>
            </div>
            <span className="text-lg font-semibold text-foreground">TechLabX</span>
          </div>

          {/* Desktop Navigation - Clean pills */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="max-w-[120px] truncate text-xs">
                  {user?.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground">Logado como</p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 pt-2 border-t border-border/40">
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left
                      transition-all duration-200
                      ${isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile User Info & Logout */}
              <div className="border-t border-border/40 mt-2 pt-2">
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {user?.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
