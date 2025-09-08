import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerAccountSkeleton } from '@/components/ui/data-skeleton';
import {
  User,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  ChevronRight,
  Users,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatPhoneForDisplay } from '@/lib/phone-utils';
import { ChargeModal } from '@/components/forms/ChargeModal';
import { useState } from 'react';
import { AffiliationSearchInput } from '@/components/ui/affiliation-search-input';

interface CustomerAccount {
  id: string;
  client_id: string;
  current_balance: number;
  total_sales: number;
  total_payments: number;
  last_transaction_at: string | null;
  status: 'active' | 'blocked' | 'inactive';
  clients: {
    name: string;
    phone?: string;
    affiliation_id?: string | null;
    affiliations?: {
      id: string;
      name: string;
    } | null;
  };
}

const CustomerAccounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<string>('');

  // Fetch affiliations for filter
  const { data: affiliations = [] } = useQuery({
    queryKey: ['affiliations'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('affiliations')
        .select('id, name, phone')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['customer-accounts'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Buscar customer_accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('customer_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('current_balance', { ascending: false });

      if (accountsError) throw accountsError;

      // Buscar clientes relacionados
      const clientIds = accountsData.map((acc) => acc.client_id);
      if (clientIds.length === 0) return [];

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, 
          name, 
          phone,
          affiliation_id,
          affiliations:affiliation_id (
            id,
            name
          )
        `)
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Combinar os dados
      const accounts = accountsData.map((account) => {
        const client = clientsData.find((c) => c.id === account.client_id);
        return {
          ...account,
          clients: client || { name: 'Cliente não encontrado', phone: null, affiliation_id: null, affiliations: null },
        };
      });

      return accounts as CustomerAccount[];
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-destructive';
    if (balance < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return TrendingUp;
    if (balance < 0) return TrendingDown;
    return Clock;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      blocked: 'destructive',
      inactive: 'secondary',
    } as const;

    const labels = {
      active: 'Ativo',
      blocked: 'Bloqueado',
      inactive: 'Inativo',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Filter accounts by affiliation
  const filteredAccounts = selectedAffiliationId 
    ? accounts.filter(account => account.clients.affiliation_id === selectedAffiliationId)
    : accounts;

  // Estatísticas gerais
  const totalAccounts = filteredAccounts.length;
  const activeAccounts = filteredAccounts.filter(
    (acc) => acc.last_transaction_at !== null
  ).length;
  const totalPendingBalance = filteredAccounts.reduce(
    (sum, acc) => (acc.current_balance > 0 ? sum + acc.current_balance : sum),
    0
  );

  const backTo =
    searchParams.get('from') !== null
      ? `/${searchParams.get('from')}`
      : '/dashboard';

  const handleChargeClick = (e: React.MouseEvent, clientName: string, clientPhone: string) => {
    e.stopPropagation();
    setSelectedClient({ name: clientName, phone: clientPhone });
    setChargeModalOpen(true);
  };

  return (
    <MobileLayout title='Fichas dos Clientes' showBackButton backTo={backTo}>
      <div className='p-4 space-y-4'>
        {/* Estatísticas Gerais */}
        <div className='grid grid-cols-3 gap-3'>
          <Card>
            <CardContent className='p-3 text-center'>
              <div className='text-2xl font-bold text-primary'>
                {totalAccounts}
              </div>
              <div className='text-xs text-muted-foreground'>Total Fichas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {activeAccounts}
              </div>
              <div className='text-xs text-muted-foreground'>Ativas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3 text-center'>
              <div className='text-lg font-bold text-destructive'>
                {formatCurrency(totalPendingBalance).replace('R$', '').trim()}
              </div>
              <div className='text-xs text-muted-foreground'>A Receber</div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className='grid grid-cols-2 gap-3'>
          <Button
            onClick={() => navigate('/clients?from=customer-accounts')}
            className='h-12 mobile-tap'
            variant='outline'
          >
            <Plus className='h-4 w-4 mr-2' />
            Novo Cliente
          </Button>

          <Button
            onClick={() => navigate('/affiliations?from=customer-accounts')}
            className='h-12 mobile-tap'
            variant='outline'
          >
            <Users className='h-4 w-4 mr-2' />
            Nova Afiliação
          </Button>
        </div>

        {/* Filtro por Afiliação */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-muted-foreground'>
            Filtrar por Afiliação
          </label>
          <AffiliationSearchInput
            affiliations={affiliations}
            value={selectedAffiliationId}
            onValueChange={setSelectedAffiliationId}
            placeholder="Todas as afiliações"
            className="w-full"
          />
        </div>

        {/* Lista de Fichas */}
        <div className='space-y-3'>
          {isLoading ? (
            [...Array(5)].map((_, i) => <CustomerAccountSkeleton key={i} />)
          ) : filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className='p-8 text-center'>
                <FileText className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                <h3 className='font-semibold mb-2'>Nenhuma ficha encontrada</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Registre seus primeiros clientes para começar
                </p>
                <Button
                  onClick={() => navigate('/clients?from=customer-accounts')}
                  className='mobile-tap'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Adicionar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => {
              const BalanceIcon = getBalanceIcon(account.current_balance);

              return (
                <Card
                  key={account.id}
                  className='card-hover cursor-pointer'
                  onClick={() =>
                    navigate(`/customer-accounts/${account.client_id}`)
                  }
                >
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-lg flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <User className='h-5 w-5 text-primary' />
                        <span>{account.clients.name}</span>
                      </div>
                      <div className='flex items-center space-x-2'>
                        {getStatusBadge(account.status)}
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='space-y-3'>
                    {/* Saldo Atual */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <BalanceIcon
                          className={`h-4 w-4 ${getBalanceColor(
                            account.current_balance
                          )}`}
                        />
                        <span className='text-sm font-medium'>Saldo:</span>
                      </div>
                      <span
                        className={`font-bold ${getBalanceColor(
                          account.current_balance
                        )}`}
                      >
                        {formatCurrency(Math.abs(account.current_balance))}
                        {account.current_balance < 0 && ' (crédito)'}
                      </span>
                    </div>

                    {/* Resumo de Totais */}
                    <div className='flex items-center justify-between gap-4 pt-2 border-t'>
                      <div className='space-y-1'>
                        <div className='text-xs text-muted-foreground'>
                          Total Vendas
                        </div>
                        <div className='font-medium text-sm'>
                          {formatCurrency(account.total_sales)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-muted-foreground'>
                          Total Recebido
                        </div>
                        <div className='font-medium text-sm text-green-600 text-right'>
                          {formatCurrency(account.total_payments)}
                        </div>
                      </div>
                    </div>

                    {/* Último Recebimento */}
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex flex-col space-y-1 text-xs'>
                        <span className='text-muted-foreground'>
                          Último recebimento
                        </span>
                        <span className='text-muted-foreground'>
                          {formatDate(account.last_transaction_at)}
                        </span>
                      </div>
                      {/* Botão de Cobrança (se telefone disponível) */}
                      {account.clients.phone ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
                          onClick={(e) => handleChargeClick(e, account.clients.name, account.clients.phone!)}
                        >
                          <FaWhatsapp className="h-3 w-3 mr-1" />
                          Cobrar
                        </Button>
                      ) : (
                        <div className='text-xs text-muted-foreground'>
                          Sem telefone
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal de Cobrança */}
        {selectedClient && (
          <ChargeModal
            isOpen={chargeModalOpen}
            onClose={() => setChargeModalOpen(false)}
            clientName={selectedClient.name}
            clientPhone={selectedClient.phone}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default CustomerAccounts;
