import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FinanceCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  type?: "entrada" | "saida" | "neutral" | "warning";
  change?: {
    value: string;
    type: "positive" | "negative";
  };
  className?: string;
}

const FinanceCard = ({
  title,
  value,
  subtitle,
  icon,
  type = "neutral",
  change,
  className
}: FinanceCardProps) => {
  const getTypeStyles = () => {
    switch (type) {
      case "entrada":
        return "border-l-4 border-l-entrada bg-gradient-to-r from-entrada/5 to-transparent";
      case "saida":
        return "border-l-4 border-l-saida bg-gradient-to-r from-saida/5 to-transparent";
      case "warning":
        return "border-l-4 border-l-pendente bg-gradient-to-r from-pendente/5 to-transparent";
      default:
        return "border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent";
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(val);
    }
    return val;
  };

  return (
    <Card className={cn("h-molina-card", getTypeStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {change && (
            <div className="flex items-center space-x-1">
              <Badge 
                variant={change.type === "positive" ? "default" : "destructive"}
                className="text-xs"
              >
                {change.type === "positive" ? "+" : ""}{change.value}
              </Badge>
              <span className="text-xs text-muted-foreground">vs. mês anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceCard;