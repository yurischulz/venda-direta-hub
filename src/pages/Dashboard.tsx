import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Package,
  HandCoins,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCardSkeleton } from '@/components/ui/data-skeleton';

import { SaleForm } from '@/components/forms/SaleForm';
import { PaymentForm } from '@/components/forms/PaymentForm';

const fetchDashboardStats = async () => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const [clientsRes, salesRes, paymentsRes] = await Promise.all([
    supabase.from('clients').select('id').eq('user_id', userId),
    supabase.from('sales').select('total').eq('user_id', userId),
    supabase.from('payments').select('amount').eq('user_id', userId),
  ]);

  const totalClients = clientsRes.data?.length || 0;
  const totalSales =
    salesRes.data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
  const totalPayments =
    paymentsRes.data?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ) || 0;
  const balance = totalSales - totalPayments;

  return { totalClients, totalSales, totalPayments, balance };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleSaleFormSuccess = () => {
    setIsSaleDialogOpen(false);
    refetch();
  };

  const handlePaymentFormSuccess = () => {
    setIsPaymentDialogOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <MobileLayout title="D'Cris">
        <div className='p-4 space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className='grid grid-cols-2 gap-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <div className='p-4 space-y-2'>
                  <div className='w-12 h-12 bg-muted rounded-full mx-auto animate-pulse' />
                  <div className='h-4 bg-muted rounded animate-pulse' />
                  <div className='h-3 bg-muted rounded animate-pulse w-2/3 mx-auto' />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="D'Cris">
      <div className='p-4 pb-20 space-y-6'>
        {/* Stats Cards */}
        <div className='grid grid-cols-2 gap-4'>
          <Card className='animate-scale-in'>
            <CardHeader className='pb-2'>
              <CardTitle
                className={`
                  text-xs text-muted-foreground flex items-center space-x-1
                  text-gray-800 dark:text-gray-300
                `}
              >
                <Users className='h-4 w-4 mr-1' />
                <span
                  className={`
                      inline-flex items-center justify-center rounded-full
                    `}
                >
                  Clientes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-bold'>
                {stats?.totalClients || 0}
              </div>
            </CardContent>
          </Card>

          <Card className='animate-scale-in' style={{ animationDelay: '0.1s' }}>
            <CardHeader className='pb-2'>
              <CardTitle
                className={`
                  text-xs text-muted-foreground flex items-center space-x-1
                  text-gray-800 dark:text-gray-300
                `}
              >
                <ShoppingCart className='h-4 w-4 mr-1' />
                <span
                  className={`
                      inline-flex items-center justify-center rounded-full
                    `}
                >
                  Vendas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-lg font-bold'>
                {formatCurrency(stats?.totalSales || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className='animate-scale-in' style={{ animationDelay: '0.2s' }}>
            <CardHeader className='pb-2'>
              <CardTitle
                className={`
                  text-xs text-muted-foreground flex items-center space-x-1
                  text-gray-800 dark:text-gray-300
                `}
              >
                <HandCoins className='h-4 w-4 mr-1' />
                <span
                  className={`
                      inline-flex items-center justify-center rounded-full
                    `}
                >
                  Recebido
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-lg font-bold'>
                {formatCurrency(stats?.totalPayments || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className='animate-scale-in' style={{ animationDelay: '0.3s' }}>
            <CardHeader className='pb-2'>
              <CardTitle
                className={`
                  text-xs text-muted-foreground flex items-center space-x-1
                  text-gray-800 dark:text-gray-300
                `}
              >
                <TrendingUp className='h-4 w-4 mr-1' />
                <span
                  className={`
                      inline-flex items-center justify-center rounded-full
                    `}
                >
                  Saldo
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-lg font-bold ${
                  (stats?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(stats?.balance || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className='text-lg font-semibold mb-4'>Ações Rápidas</h2>
          <div className='grid grid-cols-2 gap-4'>
            <Card
              className='card-hover animate-slide-up'
              style={{ animationDelay: '0.2s' }}
            >
              <Link to='/customer-accounts' className='block p-4'>
                <div className='text-center space-y-3'>
                  <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <Users className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Crediário</h3>
                    <p className='text-xs text-muted-foreground'>
                      Controlar contas de clientes
                    </p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card
              className='card-hover animate-slide-up'
              style={{ animationDelay: '0.1s' }}
            >
              <Link to='/products' className='block p-4'>
                <div className='text-center space-y-3'>
                  <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <Package className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Produtos</h3>
                    <p className='text-xs text-muted-foreground'>Catálogo</p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card
              className='card-hover animate-slide-up'
              style={{ animationDelay: '0.4s' }}
            >
              <Link to='/sales' className='block p-4'>
                <div className='text-center space-y-3'>
                  <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <ShoppingCart className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Vendas</h3>
                    <p className='text-xs text-muted-foreground'>Registrar</p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card
              className='card-hover animate-slide-up'
              style={{ animationDelay: '0.3s' }}
            >
              <Link to='/payments' className='block p-4'>
                <div className='text-center space-y-3'>
                  <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <HandCoins className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Recebimentos</h3>
                    <p className='text-xs text-muted-foreground'>Controlar</p>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      {/* Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <SaleForm onSuccess={handleSaleFormSuccess} />
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Novo Recebimento</DialogTitle>
          </DialogHeader>
          <PaymentForm onSuccess={handlePaymentFormSuccess} />
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default Dashboard;
