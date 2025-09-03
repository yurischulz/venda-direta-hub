import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, ShoppingCart, DollarSign, TrendingUp, LogOut, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const fetchDashboardStats = async () => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('User not authenticated');

  const [clientsRes, salesRes, paymentsRes] = await Promise.all([
    supabase.from('clients').select('id').eq('user_id', userId),
    supabase.from('sales').select('total').eq('user_id', userId),
    supabase.from('payments').select('amount').eq('user_id', userId)
  ]);

  const totalClients = clientsRes.data?.length || 0;
  const totalSales = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
  const totalPayments = paymentsRes.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const balance = totalSales - totalPayments;

  return { totalClients, totalSales, totalPayments, balance };
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    enabled: !!user
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <header className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-20" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold">SwiftSale</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>

      <main className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalPayments || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(stats?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats?.balance || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link to="/clients" className="block p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Clientes</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar clientes</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link to="/affiliations" className="block p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Afiliações</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar afiliações</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link to="/products" className="block p-6">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Produtos</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar produtos</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link to="/sales" className="block p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Vendas</h3>
                  <p className="text-sm text-muted-foreground">Registrar vendas</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Link to="/payments" className="block p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Pagamentos</h3>
                  <p className="text-sm text-muted-foreground">Registrar pagamentos</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        {/* FAB for quick actions */}
        <div className="fixed bottom-6 right-6">
          <Button asChild size="lg" className="rounded-full h-14 w-14 shadow-lg">
            <Link to="/sales/new">
              <Plus className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;