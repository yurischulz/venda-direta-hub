import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import {
  MobileTabs,
  MobileTabsList,
  MobileTabsTrigger,
  MobileTabsContent,
} from '@/components/ui/mobile-tabs';
import { SaleForm } from '@/components/forms/SaleForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Calendar,
  Search,
  ExternalLink,
  BarChart3,
  Users,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  client_id: string;
  total: number;
  status: 'draft' | 'finalized' | 'cancelled';
  created_at: string;
  clients: {
    name: string;
    id: string;
  };
  affiliations?: {
    name: string;
  };
  sale_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    products?: {
      name: string;
      unit: string;
    };
  }>;
}

interface CustomerAccountSummary {
  client_id: string;
  current_balance: number;
  status: 'active' | 'blocked' | 'inactive';
}

const Sales = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'draft' | 'finalized' | 'cancelled'
  >('all');
  const [clientFilter, setClientFilter] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch sales data
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sales')
        .select(
          `
          *,
          clients (id, name),
          affiliations (name),
          sale_items (
            id,
            quantity,
            unit_price,
            products (name, unit)
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
  });

  // Fetch customer accounts for integration
  const { data: customerAccounts = [] } = useQuery({
    queryKey: ['customer-accounts-summary'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customer_accounts')
        .select('client_id, current_balance, status')
        .eq('user_id', userId);

      if (error) throw error;
      return data as CustomerAccountSummary[];
    },
  });

  // Create lookup map for customer accounts
  const accountsMap = useMemo(() => {
    return customerAccounts.reduce((acc, account) => {
      acc[account.client_id] = account;
      return acc;
    }, {} as Record<string, CustomerAccountSummary>);
  }, [customerAccounts]);

  // Filter and search sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        searchTerm === '' ||
        sale.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.total.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' || sale.status === statusFilter;
      const matchesClient =
        clientFilter === 'all' || sale.client_id === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [sales, searchTerm, statusFilter, clientFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const finalizedSales = sales.filter((s) => s.status === 'finalized');
    const draftSales = sales.filter((s) => s.status === 'draft');
    const avgSaleValue = totalSales > 0 ? totalValue / totalSales : 0;

    return {
      totalSales,
      totalValue,
      finalizedCount: finalizedSales.length,
      draftCount: draftSales.length,
      avgSaleValue,
      finalizedValue: finalizedSales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
      ),
    };
  }, [sales]);

  const deleteMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { error } = await supabase.from('sales').delete().eq('id', saleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({
        queryKey: ['customer-accounts-summary'],
      });
      queryClient.invalidateQueries({ queryKey: ['customer-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Venda removida!',
        description: 'A venda foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a venda.',
        variant: 'destructive',
      });
    },
  });

  const handleFormSuccess = () => {
    setActiveTab('dashboard');
  };

  const handleDelete = (saleId: string) => {
    if (confirm('Tem certeza que deseja remover esta venda?')) {
      deleteMutation.mutate(saleId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      finalized: 'default',
      cancelled: 'destructive',
    } as const;

    const labels = {
      draft: 'Rascunho',
      finalized: 'Finalizada',
      cancelled: 'Cancelada',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getAccountStatusColor = (balance: number) => {
    if (balance > 0) return 'text-red-600';
    if (balance < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = sales.reduce((acc, sale) => {
      if (!acc.find((c) => c.id === sale.client_id)) {
        acc.push({ id: sale.client_id, name: sale.clients.name });
      }
      return acc;
    }, [] as Array<{ id: string; name: string }>);
    return clients.sort((a, b) => a.name.localeCompare(b.name));
  }, [sales]);

  return (
    <MobileLayout
      title='Vendas'
      showBackButton
      backTo='/dashboard'
      actions={
        <div className='flex items-center space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/customer-accounts?from=sales')}
            className='mobile-tap'
          >
            <Users className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/products?from=sales')}
            className='mobile-tap'
          >
            <Package className='h-4 w-4' />
          </Button>
        </div>
      }
    >
      <div className='p-4'>
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value='dashboard'>Dashboard</MobileTabsTrigger>
            <MobileTabsTrigger value='list'>
              Lista ({filteredSales.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value='add'>Nova Venda</MobileTabsTrigger>
          </MobileTabsList>

          {/* Dashboard Tab */}
          <MobileTabsContent value='dashboard'>
            <div className='space-y-4 mt-4'>
              {/* Empty State for Dashboard */}
              {sales.length === 0 ? (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <ShoppingCart className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                    <h3 className='font-semibold mb-2'>
                      Nenhuma venda encontrada
                    </h3>
                    <p className='text-sm text-muted-foreground mb-4'>
                      Registre suas primeiras vendas para começar
                    </p>
                    <Button
                      onClick={() => setActiveTab('add')}
                      className='mobile-tap'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Nova Venda
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Statistics Cards */}
                  <div className='grid grid-cols-2 gap-3'>
                    <Card>
                      <CardContent className='p-3 text-center'>
                        <div className='text-2xl font-bold text-primary'>
                          {stats.totalSales}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Total de Vendas
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-3 text-center'>
                        <div className='text-lg font-bold text-green-600'>
                          {formatCurrency(stats.finalizedValue)
                            .replace('R$', '')
                            .trim()}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Valor Finalizado
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className='grid grid-cols-3 gap-2'>
                    <Card>
                      <CardContent className='p-3 text-center'>
                        <div className='text-xl font-bold text-blue-600'>
                          {stats.finalizedCount}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Finalizadas
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-3 text-center'>
                        <div className='text-xl font-bold text-orange-600'>
                          {stats.draftCount}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Rascunhos
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-3 text-center'>
                        <div className='text-sm font-bold text-purple-600'>
                          {formatCurrency(stats.avgSaleValue)
                            .replace('R$', '')
                            .trim()}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Média
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Sales Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base flex items-center justify-between'>
                        <span>Vendas Recentes</span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setActiveTab('list')}
                          className='mobile-tap text-xs'
                        >
                          Ver todas <ExternalLink className='h-3 w-3 ml-1' />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      {sales.slice(0, 3).map((sale) => (
                        <div
                          key={sale.id}
                          className='flex items-center justify-between p-2 bg-muted/50 rounded'
                        >
                          <div>
                            <div className='font-medium text-sm'>
                              {sale.clients.name}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatDate(sale.created_at)}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-bold text-sm'>
                              {formatCurrency(Number(sale.total))}
                            </div>
                            {getStatusBadge(sale.status)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </MobileTabsContent>

          {/* List Tab */}
          <MobileTabsContent value='list'>
            <div className='space-y-4 mt-4'>
              {/* Filters and Search */}
              <div className='space-y-3'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                  <Input
                    placeholder='Buscar por cliente ou valor...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>

                <div className='flex space-x-2'>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                  >
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos os Status</SelectItem>
                      <SelectItem value='finalized'>Finalizadas</SelectItem>
                      <SelectItem value='draft'>Rascunhos</SelectItem>
                      <SelectItem value='cancelled'>Canceladas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Cliente' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos os Clientes</SelectItem>
                      {uniqueClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sales List */}
              {salesLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className='p-4'>
                      <Skeleton className='h-6 w-2/3 mb-2' />
                      <Skeleton className='h-4 w-1/2 mb-1' />
                      <Skeleton className='h-4 w-1/3' />
                    </CardContent>
                  </Card>
                ))
              ) : filteredSales.length === 0 ? (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <ShoppingCart className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                    <h3 className='font-semibold mb-2'>
                      {sales.length === 0
                        ? 'Nenhuma venda registrada'
                        : 'Nenhuma venda encontrada'}
                    </h3>
                    <p className='text-sm text-muted-foreground mb-4'>
                      {sales.length === 0
                        ? 'Comece registrando sua primeira venda'
                        : 'Tente ajustar os filtros de busca'}
                    </p>
                    {sales.length === 0 && (
                      <Button
                        onClick={() => setActiveTab('add')}
                        className='mobile-tap'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Nova Venda
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredSales.map((sale) => {
                  const customerAccount = accountsMap[sale.client_id];

                  return (
                    <Card key={sale.id} className='card-hover'>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-lg flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            {formatCurrency(Number(sale.total))}
                            {getStatusBadge(sale.status)}
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                navigate(`/customer-accounts/${sale.client_id}`)
                              }
                              className='mobile-tap'
                              title='Ver ficha do cliente'
                            >
                              <ExternalLink className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDelete(sale.id)}
                              className='mobile-tap text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center text-sm'>
                            <User className='h-4 w-4 mr-2 text-muted-foreground' />
                            <span>{sale.clients.name}</span>
                            {sale.affiliations && (
                              <span className='ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded'>
                                {sale.affiliations.name}
                              </span>
                            )}
                          </div>

                          {/* Customer Account Balance */}
                          {customerAccount && (
                            <div className='text-right'>
                              <div className='text-xs text-muted-foreground'>
                                Saldo:
                              </div>
                              <div
                                className={`text-xs font-bold ${getAccountStatusColor(
                                  customerAccount.current_balance
                                )}`}
                              >
                                {formatCurrency(
                                  Math.abs(customerAccount.current_balance)
                                )}
                                {customerAccount.current_balance < 0 &&
                                  ' (crédito)'}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className='flex items-center text-sm text-muted-foreground'>
                          <Calendar className='h-4 w-4 mr-2' />
                          {formatDate(sale.created_at)}
                          {sale.status === 'finalized' && (
                            <span className='ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded'>
                              Contabilizada
                            </span>
                          )}
                        </div>

                        {/* Sale Items */}
                        <div className='space-y-1'>
                          <p className='text-xs font-medium text-muted-foreground'>
                            Itens ({sale.sale_items.length}):
                          </p>
                          {sale.sale_items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className='text-xs bg-muted/50 p-2 rounded'
                            >
                              <div className='flex justify-between items-start'>
                                <div>
                                  <span className='font-medium'>
                                    {item.products?.name || 'Produto removido'}
                                  </span>
                                  <div className='text-muted-foreground'>
                                    {item.quantity}{' '}
                                    {item.products?.unit || 'un'} ×{' '}
                                    {formatCurrency(Number(item.unit_price))}
                                  </div>
                                </div>
                                <span className='font-medium'>
                                  {formatCurrency(
                                    Number(item.quantity) *
                                      Number(item.unit_price)
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                          {sale.sale_items.length > 2 && (
                            <div className='text-xs text-muted-foreground text-center py-1'>
                              +{sale.sale_items.length - 2} item(ns)
                              adicional(is)
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </MobileTabsContent>

          {/* Add Sale Tab */}
          <MobileTabsContent value='add'>
            <div className='mt-4'>
              <SaleForm onSuccess={handleFormSuccess} />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default Sales;
