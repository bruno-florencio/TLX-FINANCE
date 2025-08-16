import { useState } from "react";
import TransactionTable, { Transaction } from "@/components/tables/TransactionTable";
import { useToast } from "@/hooks/use-toast";

const EntradasTab = () => {
  const { toast } = useToast();
  
  // Mock data - futuramente será integrado com Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      description: "Venda de Produto A",
      category: "Vendas",
      value: 2500.00,
      date: "2024-01-10",
      dueDate: "2024-01-15",
      status: "pendente",
      type: "entrada",
      account: "Conta Corrente"
    },
    {
      id: "2", 
      description: "Prestação de Serviço",
      category: "Serviços",
      value: 3200.00,
      date: "2024-01-08",
      dueDate: "2024-01-12",
      status: "pago",
      type: "entrada",
      account: "Conta Poupança"
    },
    {
      id: "3",
      description: "Consultoria Técnica",
      category: "Consultoria", 
      value: 1800.00,
      date: "2024-01-05",
      dueDate: "2024-01-10",
      status: "atrasado",
      type: "entrada",
      account: "Conta Corrente"
    },
    {
      id: "4",
      description: "Venda Online",
      category: "E-commerce",
      value: 750.00,
      date: "2024-01-12",
      dueDate: "2024-01-18",
      status: "pendente", 
      type: "entrada",
      account: "Conta Digital"
    }
  ]);

  const handleEdit = (transaction: Transaction) => {
    toast({
      title: "Editar Entrada",
      description: `Funcionalidade de edição será implementada para: ${transaction.description}`,
    });
    // TODO: Implementar modal de edição
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Entrada Excluída",
      description: "A entrada foi removida com sucesso.",
      variant: "destructive"
    });
  };

  const handleMarkAsPaid = (id: string) => {
    setTransactions(prev => 
      prev.map(t => 
        t.id === id ? { ...t, status: "pago" as const } : t
      )
    );
    toast({
      title: "Entrada Marcada como Paga",
      description: "O status foi atualizado com sucesso.",
    });
  };

  const handleAdd = () => {
    toast({
      title: "Nova Entrada",
      description: "Modal de cadastro será implementado.",
    });
    // TODO: Implementar modal de adição
  };

  return (
    <div className="space-y-6">
      <TransactionTable
        transactions={transactions}
        type="entrada"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkAsPaid={handleMarkAsPaid}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default EntradasTab;