import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerAccountSkeleton } from '@/components/ui/data-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useState, useMemo, useEffect } from 'react';
import { AffiliationSearchInput } from '@/components/ui/affiliation-search-input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { findNearbyAffiliations } from '@/utils/geolocation';
import { AffiliationProximityModal } from '@/components/modals/AffiliationProximityModal';
import { cn } from '@/lib/utils';
import {
  MobileTabs,
  MobileTabsList,
  MobileTabsTrigger,
  MobileTabsContent,
} from '@/components/ui/mobile-tabs';
import { ClientForm } from '@/components/forms/ClientForm';
import { AffiliationForm } from '@/components/forms/AffiliationForm';
import { AffiliationsList } from '@/components/AffiliationsList';

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
  const [selectedAffiliationId, setSelectedAffiliationId] =
    useState<string>('');
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
  const [nearbyAffiliations, setNearbyAffiliations] = useState<
    Array<{
      id: string;
      name: string;
      distance: number;
      type: 'affiliation' | 'client';
    }>
  >([]);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [hasInteractedWithModal, setHasInteractedWithModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'clientes' | 'afiliacoes' | 'cadastrar'
  >('clientes');
  const [cadastroTab, setCadastroTab] = useState('client');

  const { getCurrentPosition } = useGeolocation();

  const affiliationFilter = searchParams.get('affiliation');
  const clientFilter = searchParams.get('client');

  // Set selected affiliation when URL param changes
  useEffect(() => {
    if (affiliationFilter) {
      setSelectedAffiliationId(affiliationFilter);
    }
  }, [affiliationFilter]);

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

  // Fetch affiliations with coordinates for proximity check
  const { data: affiliationsWithCoordinates = [] } = useQuery({
    queryKey: ['affiliations-with-coordinates'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('affiliations')
        .select('id, name, latitude, longitude')
        .eq('user_id', userId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      return data;
    },
  });

  // Fetch clients with coordinates for proximity check
  const { data: clientsWithCoordinates = [] } = useQuery({
    queryKey: ['clients-with-coordinates'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, latitude, longitude')
        .eq('user_id', userId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      return data;
    },
  });

  // Check for nearby affiliations and clients on component mount
  useEffect(() => {
    const checkProximity = async () => {
      const hasAffiliations =
        affiliationsWithCoordinates && affiliationsWithCoordinates.length > 0;
      const hasClients =
        clientsWithCoordinates && clientsWithCoordinates.length > 0;

      if (!hasAffiliations && !hasClients) return;
      if (affiliationFilter || clientFilter) return; // Skip if already has filter from URL

      setIsCheckingLocation(true);

      try {
        const position = await getCurrentPosition();

        let nearby: Array<{
          id: string;
          name: string;
          distance: number;
          type: 'affiliation' | 'client';
        }> = [];

        if (position) {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          // Check nearby affiliations
          if (hasAffiliations) {
            const nearbyAffiliations = findNearbyAffiliations(
              userLat,
              userLon,
              affiliationsWithCoordinates
            );
            nearby.push(
              ...nearbyAffiliations.map((item) => ({
                ...item,
                type: 'affiliation' as const,
              }))
            );
          }

          // Check nearby clients
          if (hasClients) {
            const nearbyClients = findNearbyAffiliations(
              userLat,
              userLon,
              clientsWithCoordinates
            );
            nearby.push(
              ...nearbyClients.map((item) => ({
                ...item,
                type: 'client' as const,
              }))
            );
          }

          // Sort all nearby locations by distance
          nearby.sort((a, b) => a.distance - b.distance);
        }

        // Show modal only if there are nearby locations
        if (nearby.length > 0) {
          setNearbyAffiliations(nearby);
          setIsProximityModalOpen(true);
        }
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        // Com erro de localização, não mostra a modal
      } finally {
        setIsCheckingLocation(false);
      }
    };

    // Only check proximity if we haven't checked yet and user hasn't interacted with modal yet
    const canCheckProximity =
      (affiliationsWithCoordinates.length > 0 ||
        clientsWithCoordinates.length > 0) &&
      !isProximityModalOpen &&
      !affiliationFilter &&
      !clientFilter &&
      !hasInteractedWithModal;

    if (canCheckProximity) {
      checkProximity();
    }
  }, [
    affiliationsWithCoordinates,
    clientsWithCoordinates,
    getCurrentPosition,
    isProximityModalOpen,
    affiliationFilter,
    clientFilter,
    hasInteractedWithModal,
  ]);

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
        .select(
          `
          id,
          name,
          phone,
          affiliation_id,
          affiliations:affiliation_id (
            id,
            name
          )
        `
        )
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Combinar os dados
      const accounts = accountsData.map((account) => {
        const client = clientsData.find((c) => c.id === account.client_id);
        return {
          ...account,
          clients: client || {
            name: 'Cliente não encontrado',
            phone: null,
            affiliation_id: null,
            affiliations: null,
          },
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

  // Filter accounts by type and affiliation
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Filter by type (clientes) - afiliacoes shows different content
    if (activeFilter === 'clientes') {
      // Show all accounts for clientes tab (previously "todos" functionality)
      filtered = accounts;
    }
    // 'afiliacoes' shows affiliations list instead

    // Then apply secondary filters if any (only for clientes)
    if (activeFilter !== 'afiliacoes') {
      const filterByAffiliation = affiliationFilter || selectedAffiliationId;
      const filterByClient = clientFilter;

      if (filterByAffiliation) {
        filtered = filtered.filter(
          (account) => account.clients.affiliation_id === filterByAffiliation
        );
      }

      if (filterByClient) {
        filtered = filtered.filter(
          (account) => account.client_id === filterByClient
        );
      }
    }

    return filtered;
  }, [
    accounts,
    activeFilter,
    affiliationFilter,
    selectedAffiliationId,
    clientFilter,
  ]);

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

  const handleChargeClick = (
    e: React.MouseEvent,
    clientName: string,
    clientPhone: string
  ) => {
    e.stopPropagation();
    setSelectedClient({ name: clientName, phone: clientPhone });
    setChargeModalOpen(true);
  };

  const handleFormSuccess = () => {
    // Reset to "clientes" tab after successful registration
    setActiveFilter('clientes');
  };

  return (
    <MobileLayout title='Fichas dos Clientes' showBackButton backTo={backTo}>
      <div className='p-4 space-y-4'>
        {/* Filtro por Afiliação - only show when not in cadastrar mode and not in afiliacoes view */}
        {activeFilter !== 'cadastrar' && activeFilter !== 'afiliacoes' && (
          <div className='space-y-2'>
            <label className='text-sm font-medium text-muted-foreground'>
              Filtrar por Afiliação
            </label>
            <AffiliationSearchInput
              affiliations={affiliations}
              value={selectedAffiliationId}
              onValueChange={setSelectedAffiliationId}
              placeholder='Todas as afiliações'
              className='w-full'
            />
          </div>
        )}

        {/* WhatsApp-style Pills Filter */}
        <div className='bg-background border-b border-border'>
          <div className='flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3'>
            <button
              onClick={() => setActiveFilter('clientes')}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'whitespace-nowrap select-none touch-manipulation',
                activeFilter === 'clientes'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveFilter('afiliacoes')}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'whitespace-nowrap select-none touch-manipulation',
                activeFilter === 'afiliacoes'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              Afiliações
            </button>
            <button
              onClick={() => {
                setActiveFilter('cadastrar');
              }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'whitespace-nowrap select-none touch-manipulation',
                activeFilter === 'cadastrar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              Cadastrar
            </button>
          </div>
        </div>


        {/* Content Area */}
        {activeFilter === 'cadastrar' ? (
          /* Cadastro inline */
          <div className='space-y-4'>
            <MobileTabs value={cadastroTab} onValueChange={setCadastroTab}>
              <MobileTabsList>
                <MobileTabsTrigger value='client'>
                  Cadastrar Cliente
                </MobileTabsTrigger>
                <MobileTabsTrigger value='affiliation'>
                  Cadastrar Afiliação
                </MobileTabsTrigger>
              </MobileTabsList>

              <MobileTabsContent value='client'>
                <div className='p-4 space-y-4'>
                  <div className='text-center space-y-2 mb-6'>
                    <h2 className='text-xl font-semibold text-foreground'>
                      Novo Cliente
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                      Cadastre um novo cliente para o crediário
                    </p>
                  </div>
                  <ClientForm onSuccess={handleFormSuccess} />
                </div>
              </MobileTabsContent>

              <MobileTabsContent value='affiliation'>
                <div className='p-4 space-y-4'>
                  <div className='text-center space-y-2 mb-6'>
                    <h2 className='text-xl font-semibold text-foreground'>
                      Nova Afiliação
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                      Cadastre uma nova afiliação para o sistema
                    </p>
                  </div>
                  <AffiliationForm onSuccess={handleFormSuccess} />
                </div>
              </MobileTabsContent>
            </MobileTabs>
          </div>
        ) : activeFilter === 'afiliacoes' ? (
          /* Lista de Afiliações */
          <div className='space-y-4'>
            <AffiliationsList />
          </div>
        ) : (
          /* Lista de Fichas */
          <div className='space-y-3'>
            {isCheckingLocation ? (
              <div className='space-y-4'>
                <div className='text-center p-4'>
                  <p className='text-muted-foreground mb-4'>
                    Verificando localização...
                  </p>
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className='pb-3'>
                      <Skeleton className='h-5 w-24' />
                      <Skeleton className='h-4 w-32' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-6 w-20 mb-2' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-3/4' />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isLoading ? (
              [...Array(5)].map((_, i) => <CustomerAccountSkeleton key={i} />)
            ) : filteredAccounts.length === 0 ? (
              <Card>
                <CardContent className='p-8 text-center'>
                  <FileText className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                  <h3 className='font-semibold mb-2'>
                    Nenhuma ficha encontrada
                  </h3>
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
                            variant='outline'
                            size='sm'
                            className='h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600'
                            onClick={(e) =>
                              handleChargeClick(
                                e,
                                account.clients.name,
                                account.clients.phone!
                              )
                            }
                          >
                            <FaWhatsapp className='h-3 w-3 mr-1' />
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
        )}

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

      <AffiliationProximityModal
        open={isProximityModalOpen}
        onOpenChange={setIsProximityModalOpen}
        nearbyAffiliations={nearbyAffiliations}
        onInteraction={() => setHasInteractedWithModal(true)}
      />
    </MobileLayout>
  );
};

export default CustomerAccounts;
