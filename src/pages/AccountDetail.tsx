import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import {
  MobileTabs,
  MobileTabsList,
  MobileTabsTrigger,
  MobileTabsContent,
} from '@/components/ui/mobile-tabs';
import { SaleForm } from '@/components/forms/SaleForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { ClientForm } from '@/components/forms/ClientForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Plus,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatPhoneForDisplay } from '@/lib/phone-utils';

interface AccountDetailData {
  account: {
    id: string;
    current_balance: number;
    total_sales: number;
    total_payments: number;
    last_transaction_at: string | null;
    status: 'active' | 'blocked' | 'inactive';
  };
  client: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  transactions: Array<{
    id: string;
    type: 'sale' | 'payment';
    amount: number;
    date: string;
    description: string;
    status?: 'draft' | 'finalized' | 'cancelled';
  }>;
}

const AccountDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['account-detail', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Buscar customer account
      const { data: accountData, error: accountError } = await supabase
        .from('customer_accounts')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .single();

      if (accountError) throw accountError;

      // Buscar cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (clientError) throw clientError;

      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Buscar pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combinar transações
      const transactions = [
        ...salesData.map((sale) => ({
          id: sale.id,
          type: 'sale' as const,
          amount: sale.total,
          date: sale.created_at,
          description: `Venda ${sale.status === 'draft' ? '(rascunho)' : ''}`,
          status: sale.status,
        })),
        ...paymentsData.map((payment) => ({
          id: payment.id,
          type: 'payment' as const,
          amount: payment.amount,
          date: payment.paid_at,
          description: payment.notes || 'Recebimento',
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        account: accountData,
        client: clientData,
        transactions,
      } as AccountDetailData;
    },
    enabled: !!clientId,
  });

  const handleFormSuccess = () => {
    setActiveTab('overview');
    refetch();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-destructive';
    if (balance < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getTransactionIcon = (type: string) => {
    return type === 'sale' ? ShoppingCart : DollarSign;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers and HTTP contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      toast({
        title: 'Copiado!',
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o conteúdo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MobileLayout
        title='Carregando...'
        showBackButton
        backTo='/customer-accounts'
      >
        <div className='p-4 space-y-4'>
          <Card>
            <CardContent className='p-4'>
              <Skeleton className='h-8 w-2/3 mb-4' />
              <Skeleton className='h-4 w-1/2 mb-2' />
              <Skeleton className='h-4 w-1/3' />
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  if (!data) {
    return (
      <MobileLayout title='Erro' showBackButton backTo='/customer-accounts'>
        <div className='p-4'>
          <Card>
            <CardContent className='p-8 text-center'>
              <User className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='font-semibold mb-2'>Ficha não encontrada</h3>
              <p className='text-sm text-muted-foreground'>
                Não foi possível carregar as informações desta ficha.
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  const { account, client, transactions } = data;

  return (
    <MobileLayout
      title={client.name}
      showBackButton
      backTo='/customer-accounts'
      actions={
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setActiveTab('new-sale')}
          className='mobile-tap'
        >
          <Plus className='h-4 w-4' />
        </Button>
      }
    >
      <div className='p-4'>
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value='overview'>Resumo</MobileTabsTrigger>
            <MobileTabsTrigger value='edit-client'>Editar Cliente</MobileTabsTrigger>
            <MobileTabsTrigger value='new-sale'>Nova Venda</MobileTabsTrigger>
            <MobileTabsTrigger value='payment'>Recebimento</MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value='overview'>
            <div className='space-y-4 mt-4'>
              {/* Resumo do Saldo */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span>Saldo da Ficha</span>
                    <Badge
                      variant={
                        account.current_balance > 0 ? 'success' : 'secondary'
                      }
                    >
                      {account.status === 'active'
                        ? 'Ativa'
                        : account.status === 'blocked'
                        ? 'Bloqueada'
                        : 'Inativa'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='text-center'>
                    <div
                      className={`text-3xl font-bold ${getBalanceColor(
                        account.current_balance
                      )}`}
                    >
                      {formatCurrency(Math.abs(account.current_balance))}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {account.current_balance > 0 && 'A receber'}
                      {account.current_balance < 0 && 'Cliente tem crédito'}
                      {account.current_balance === 0 && 'Saldo zerado'}
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                    <div className='text-center'>
                      <div className='text-lg font-bold'>
                        {formatCurrency(account.total_sales)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Total Vendas
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-green-600'>
                        {formatCurrency(account.total_payments)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Total Recebido
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Informações do Cliente</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setActiveTab('edit-client')}
                      className='mobile-tap'
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>{client.name}</span>
                  </div>
                  {client.phone && (
                    <div className='flex items-center justify-between text-sm group'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-muted-foreground'>📞</span>
                        <span>{formatPhoneForDisplay(client.phone)}</span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(client.phone!, 'Telefone')
                        }
                        className='opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 mobile-tap'
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                  )}
                  {client.email && (
                    <div className='flex items-center justify-between text-sm group'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-muted-foreground'>✉️</span>
                        <span>{client.email}</span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => copyToClipboard(client.email!, 'Email')}
                        className='opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 mobile-tap'
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Transações */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Histórico de Transações ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {transactions.length === 0 ? (
                    <div className='text-center py-8'>
                      <Calendar className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        Nenhuma transação registrada
                      </p>
                    </div>
                  ) : (
                    transactions.slice(0, 10).map((transaction) => {
                      const Icon = getTransactionIcon(transaction.type);

                      return (
                        <div
                          key={transaction.id}
                          className='flex items-center justify-between p-3 bg-muted/50 rounded'
                        >
                          <div className='flex items-center space-x-3'>
                            <div
                              className={`p-2 rounded-full ${
                                transaction.type === 'sale'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              <Icon className='h-4 w-4' />
                            </div>
                            <div>
                              <div className='font-medium'>
                                {transaction.description}
                                {transaction.status === 'draft' && (
                                  <Badge
                                    variant='outline'
                                    className='ml-2 text-xs'
                                  >
                                    Rascunho
                                  </Badge>
                                )}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`font-bold ${
                              transaction.type === 'sale'
                                ? 'text-primary'
                                : 'text-green-600'
                            }`}
                          >
                            {transaction.type === 'sale' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {transactions.length > 10 && (
                    <div className='text-center pt-2'>
                      <Button variant='ghost' size='sm' className='text-xs'>
                        Ver todas as transações
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='edit-client'>
            <div className='mt-4'>
              <ClientForm
                clientId={clientId}
                onSuccess={handleFormSuccess}
              />
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='new-sale'>
            <div className='mt-4'>
              <SaleForm
                preselectedClientId={clientId}
                onSuccess={handleFormSuccess}
              />
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='payment'>
            <div className='mt-4'>
              <PaymentForm
                preselectedClientId={clientId}
                onSuccess={handleFormSuccess}
              />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default AccountDetail;
