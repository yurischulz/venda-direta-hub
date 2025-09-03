import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent } from "@/components/ui/mobile-tabs";
import { SaleForm } from "@/components/forms/SaleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, ShoppingCart, User, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Sale {
  id: string;
  total: number;
  created_at: string;
  clients: {
    name: string;
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

const Sales = () => {
  const [activeTab, setActiveTab] = useState("list");
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients (name),
          affiliations (name),
          sale_items (
            id,
            quantity,
            unit_price,
            products (name, unit)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Venda removida!",
        description: "A venda foi removida com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a venda.",
        variant: "destructive"
      });
    }
  });

  const handleFormSuccess = () => {
    setActiveTab("list");
  };

  const handleDelete = (saleId: string) => {
    if (confirm("Tem certeza que deseja remover esta venda?")) {
      deleteMutation.mutate(saleId);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <MobileLayout 
      title="Vendas" 
      showBackButton 
      backTo="/dashboard"
      actions={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setActiveTab("add")}
          className="mobile-tap"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="p-4">
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value="list">
              Lista ({sales.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value="add">
              Nova Venda
            </MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value="list">
            <div className="space-y-4 mt-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))
              ) : sales.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Nenhuma venda registrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece registrando sua primeira venda
                    </p>
                    <Button onClick={() => setActiveTab("add")} className="mobile-tap">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sales.map((sale) => (
                  <Card key={sale.id} className="card-hover">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <span>{formatCurrency(Number(sale.total))}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sale.id)}
                          className="mobile-tap text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{sale.clients.name}</span>
                        {sale.affiliations && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {sale.affiliations.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(sale.created_at)}
                      </div>

                      {/* Sale Items */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Itens:</p>
                        {sale.sale_items.map((item, index) => (
                          <div key={item.id} className="text-xs bg-muted/50 p-2 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">
                                  {item.products?.name || 'Produto removido'}
                                </span>
                                <div className="text-muted-foreground">
                                  {item.quantity} {item.products?.unit || 'un'} × {formatCurrency(Number(item.unit_price))}
                                </div>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </MobileTabsContent>

          <MobileTabsContent value="add">
            <div className="mt-4">
              <SaleForm onSuccess={handleFormSuccess} />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default Sales;