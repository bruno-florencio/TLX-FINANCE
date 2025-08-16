import { useState } from "react";
import TransactionTable, { Transaction } from "@/components/tables/TransactionTable";
import { useToast } from "@/hooks/use-toast";

const SaidasTab = () => {
  const { toast } = useToast();
  
  // Mock data - futuramente será integrado com Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "5",
      description: "Pagamento Fornecedor ABC",
      category: "Fornecedores",
      value: 1500.00,
      date: "2024-01-09",
      dueDate: "2024-01-15",
      status: "pendente",
      type: "saida",
      supplier: "ABC Ltda"
    },
    {
      id: "6",
      description: "Aluguel do Escritório",
      category: "Despesas Fixas",
      value: 2200.00,
      date: "2024-01-01",
      dueDate: "2024-01-10",
      status: "pago",
      type: "saida",
      account: "Conta Corrente"
    },
    {
      id: "7",
      description: "Material de Escritório",
      category: "Suprimentos",
      value: 350.00,
      date: "2024-01-11",
      dueDate: "2024-01-16",
      status: "pendente",
      type: "saida",
      supplier: "Papelaria XYZ"
    },
    {
      id: "8",
      description: "Energia Elétrica",
      category: "Utilidades",
      value: 480.00,
      date: "2024-01-03",
      dueDate: "2024-01-08",
      status: "atrasado",
      type: "saida",
      account: "Conta Corrente"
    },
    {
      id: "9",
      description: "Software de Gestão",
      category: "Tecnologia",
      value: 299.00,
      date: "2024-01-12",
      dueDate: "2024-01-20",
      status: "pendente",
      type: "saida",
      account: "Cartão de Crédito"
    }
  ]);

  const handleEdit = (transaction: Transaction) => {
    toast({
      title: "Editar Saída",
      description: `Funcionalidade de edição será implementada para: ${transaction.description}`,
    });
    // TODO: Implementar modal de edição
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Saída Excluída",
      description: "A saída foi removida com sucesso.",
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
      title: "Saída Marcada como Paga",
      description: "O status foi atualizado com sucesso.",
    });
  };

  const handleAdd = () => {
    toast({
      title: "Nova Saída",
      description: "Modal de cadastro será implementado.",
    });
    // TODO: Implementar modal de adição
  };

  return (
    <div className="space-y-6">
      <TransactionTable
        transactions={transactions}
        type="saida"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkAsPaid={handleMarkAsPaid}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default SaidasTab;