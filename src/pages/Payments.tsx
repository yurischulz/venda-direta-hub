import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, DollarSign } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import {
  MobileTabs,
  MobileTabsList,
  MobileTabsTrigger,
  MobileTabsContent,
} from '@/components/ui/mobile-tabs';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState<'balances' | 'history'>('balances');
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading: isLoadingBalances } = useQuery({
    queryKey: ['client-balances'],
    queryFn: async () => {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');

      if (clientsError) throw clientsError;

      const balances = [];
      for (const client of clients) {
        // Buscar total de vendas
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('total')
          .eq('client_id', client.id);

        if (salesError) throw salesError;

        // Buscar total de recebimentos
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('client_id', client.id);

        if (paymentsError) throw paymentsError;

        const totalSales =
          sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
        const totalPayments =
          payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
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

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          paid_at,
          clients (name)
        `
        )
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Recebimento excluído',
        description: 'O recebimento foi excluído com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['client-balances'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o recebimento.',
        variant: 'destructive',
      });
    },
  });

  const handleFormSuccess = () => {
    setActiveTab('list');
  };

  const handleDelete = (paymentId: string) => {
    if (confirm('Tem certeza que deseja remover este recebimento?')) {
      deleteMutation.mutate(paymentId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <MobileLayout title='Recebimentos' showBackButton backTo='/dashboard'>
      <div className='p-4'>
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value='list'>
              Lista ({payments.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value='add'>Novo Recebimento</MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value='list'>
            <div className='space-y-4 mt-4'>
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as 'balances' | 'history')
                }
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='balances'>Saldos</TabsTrigger>
                  <TabsTrigger value='history'>Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value='balances' className='space-y-4 mt-4'>
                  {isLoadingBalances ? (
                    [...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className='p-4'>
                          <Skeleton className='h-6 w-2/3 mb-2' />
                          <Skeleton className='h-4 w-1/2 mb-1' />
                          <Skeleton className='h-4 w-1/3' />
                        </CardContent>
                      </Card>
                    ))
                  ) : balances.length === 0 ? (
                    <Card>
                      <CardContent className='p-8 text-center'>
                        <DollarSign className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                        <h3 className='font-semibold mb-2'>
                          Nenhum saldo pendente
                        </h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          Todos os clientes estão em dia com os pagamentos
                        </p>
                        <Button
                          onClick={() => setActiveTab('add')}
                          className='mobile-tap'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Registrar Recebimento
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      {balances.map((balance) => (
                        <Card key={balance.client_id}>
                          <CardContent className='p-4'>
                            <div className='flex-1'>
                              <div className='flex justify-between items-start'>
                                <h3 className='font-medium mb-2'>
                                  {balance.client_name}
                                </h3>
                                <Badge
                                  variant={
                                    balance.balance > 0
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className='ml-2'
                                >
                                  {formatCurrency(balance.balance)}
                                </Badge>
                              </div>
                              <div className='flex justify-between items-start'>
                                <div className='space-y-1 text-sm text-muted-foreground w-full'>
                                  <div className='flex justify-between'>
                                    <span>Vendas:</span>
                                    <span>
                                      {formatCurrency(balance.total_sales)}
                                    </span>
                                  </div>
                                  <div className='flex justify-between'>
                                    <span>Recebimentos:</span>
                                    <span>
                                      {formatCurrency(balance.total_payments)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='history' className='space-y-4 mt-4'>
                  {isLoadingPayments ? (
                    [...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className='p-4'>
                          <Skeleton className='h-6 w-2/3 mb-2' />
                          <Skeleton className='h-4 w-1/2 mb-1' />
                          <Skeleton className='h-4 w-1/3' />
                        </CardContent>
                      </Card>
                    ))
                  ) : payments.length === 0 ? (
                    <Card>
                      <CardContent className='p-8 text-center'>
                        <DollarSign className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                        <h3 className='font-semibold mb-2'>
                          Nenhum recebimento registrado
                        </h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          Registre seus primeiros recebimentos
                        </p>
                        <Button
                          onClick={() => setActiveTab('add')}
                          className='mobile-tap'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Registrar Recebimento
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-3'>
                      {payments.map((payment) => (
                        <Card key={payment.id}>
                          <CardContent className='p-4'>
                            <div className='flex justify-between items-start'>
                              <div className='flex-1'>
                                <h3 className='font-medium'>
                                  {payment.clients?.name}
                                </h3>
                                <p className='text-sm text-muted-foreground'>
                                  {formatDate(payment.paid_at)}
                                </p>
                                <p className='font-semibold text-primary'>
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleDelete(payment.id)}
                                className='mobile-tap'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='add'>
            <div className='mt-4'>
              <PaymentForm onSuccess={handleFormSuccess} />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
}
