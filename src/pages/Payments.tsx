import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Payments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: balances = [], refetch: refetchBalances } = useQuery({
    queryKey: ["client-balances"],
    queryFn: async () => {
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name");
      
      if (clientsError) throw clientsError;

      const balances = [];
      for (const client of clients) {
        // Buscar total de vendas
        const { data: sales, error: salesError } = await supabase
          .from("sales")
          .select("total")
          .eq("client_id", client.id);
        
        if (salesError) throw salesError;

        // Buscar total de recebimentos
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("amount")
          .eq("client_id", client.id);
        
        if (paymentsError) throw paymentsError;

        const totalSales = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
        const totalPayments = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const balance = totalSales - totalPayments;

        if (balance !== 0) {
          balances.push({
            client_id: client.id,
            client_name: client.name,
            total_sales: totalSales,
            total_payments: totalPayments,
            balance: balance,
          });
        }
      }

      return balances.sort((a, b) => b.balance - a.balance);
    },
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          paid_at,
          clients (name)
        `)
        .order("paid_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Recebimento excluído",
        description: "O recebimento foi excluído com sucesso.",
      });

      refetchPayments();
      refetchBalances();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir recebimento.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    refetchPayments();
    refetchBalances();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <MobileLayout title="Recebimentos" showBackButton backTo="/dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Recebimentos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Novo Recebimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Recebimento</DialogTitle>
              </DialogHeader>
              <PaymentForm onSuccess={handleFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balances">Saldos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saldos dos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum saldo pendente encontrado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {balances.map((balance) => (
                      <div
                        key={balance.client_id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{balance.client_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Vendas: {formatCurrency(balance.total_sales)} | 
                            Recebimentos: {formatCurrency(balance.total_payments)}
                          </p>
                        </div>
                        <Badge
                          variant={balance.balance > 0 ? "destructive" : "secondary"}
                        >
                          {formatCurrency(balance.balance)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Recebimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum recebimento encontrado.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[50px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.paid_at)}
                          </TableCell>
                          <TableCell>{payment.clients?.name}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}