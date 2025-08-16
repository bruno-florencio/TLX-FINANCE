import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Check, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  description: string;
  category: string;
  value: number;
  date: string;
  dueDate?: string;
  status: "pago" | "pendente" | "atrasado";
  type: "entrada" | "saida";
  account?: string;
  supplier?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  type: "entrada" | "saida";
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onAdd: () => void;
}

const TransactionTable = ({
  transactions,
  type,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onAdd
}: TransactionTableProps) => {
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredTransactions = transactions.filter(t => t.type === type);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusBadge = (status: Transaction["status"]) => {
    const baseClass = "px-2 py-1 rounded text-xs font-medium";
    
    switch (status) {
      case "pago":
        return <Badge className="pago-indicator">Pago</Badge>;
      case "pendente":
        return <Badge className="pendente-indicator">Pendente</Badge>;
      case "atrasado":
        return <Badge className="atrasado-indicator">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getTotalValue = () => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.value, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header com botão de adicionar e resumo */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-american-captain">
            {type === "entrada" ? "Entradas" : "Saídas"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(getTotalValue())} • {filteredTransactions.length} lançamentos
          </p>
        </div>
        <Button onClick={onAdd} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Novo {type === "entrada" ? "Recebimento" : "Pagamento"}</span>
        </Button>
      </div>

      {/* Tabela de transações */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="cursor-pointer hover:bg-muted/80"
                onClick={() => {
                  if (sortField === "date") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("date");
                    setSortDirection("desc");
                  }
                }}
              >
                Data
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta/Fornecedor</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/80"
                onClick={() => {
                  if (sortField === "value") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("value");
                    setSortDirection("desc");
                  }
                }}
              >
                Valor
              </TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum lançamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => (
                <TableRow 
                  key={transaction.id}
                  className={cn(
                    "hover:bg-muted/50",
                    transaction.status === "atrasado" && "bg-destructive/5"
                  )}
                >
                  <TableCell className="font-medium">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.account || transaction.supplier || "-"}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    type === "entrada" ? "text-entrada" : "text-saida"
                  )}>
                    {formatCurrency(transaction.value)}
                  </TableCell>
                  <TableCell>
                    {transaction.dueDate ? formatDate(transaction.dueDate) : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {transaction.status !== "pago" && (
                          <DropdownMenuItem onClick={() => onMarkAsPaid(transaction.id)}>
                            <Check className="w-4 h-4 mr-2" />
                            Marcar como Pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete(transaction.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;