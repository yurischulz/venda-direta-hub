import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import {
  MobileTabs,
  MobileTabsList,
  MobileTabsTrigger,
  MobileTabsContent,
} from '@/components/ui/mobile-tabs';
import { ProductForm } from '@/components/forms/ProductForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  unit: string;
}

const Products = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto removido!',
        description: 'O produto foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o produto.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (productId: string) => {
    setEditingProduct(productId);
    setActiveTab('add');
  };

  const handleFormSuccess = () => {
    setEditingProduct(null);
    setActiveTab('list');
  };

  const handleDelete = (productId: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      deleteMutation.mutate(productId);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const [searchParams] = useSearchParams();

  const backTo =
    searchParams.get('from') !== null
      ? `/${searchParams.get('from')}`
      : '/dashboard';

  return (
    <MobileLayout title='Produtos' showBackButton backTo={backTo}>
      <div className='p-4'>
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value='list'>
              Lista ({products.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value='add'>
              {editingProduct ? 'Editar' : 'Adicionar'}
            </MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value='list'>
            <div className='space-y-4 mt-4'>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className='p-4'>
                      <Skeleton className='h-6 w-2/3 mb-2' />
                      <Skeleton className='h-4 w-1/2 mb-1' />
                      <Skeleton className='h-4 w-1/3' />
                    </CardContent>
                  </Card>
                ))
              ) : products.length === 0 ? (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <Package className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                    <h3 className='font-semibold mb-2'>
                      Nenhum produto cadastrado
                    </h3>
                    <p className='text-sm text-muted-foreground mb-4'>
                      Cadastre produtos para facilitar suas vendas
                    </p>
                    <Button
                      onClick={() => setActiveTab('add')}
                      className='mobile-tap'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Adicionar Produto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product.id} className='card-hover'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-lg flex items-center justify-between'>
                        <span className='truncate'>{product.name}</span>
                        <div className='flex space-x-2 ml-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEdit(product.id)}
                            className='mobile-tap'
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDelete(product.id)}
                            className='mobile-tap text-destructive'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <div className='flex items-center text-lg font-semibold text-primary'>
                        {formatCurrency(product.price)}
                      </div>
                      {product.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {product.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='add'>
            <div className='mt-4'>
              <ProductForm
                productId={editingProduct || undefined}
                onSuccess={handleFormSuccess}
              />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default Products;
