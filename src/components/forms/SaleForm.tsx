import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientSearchInput } from '@/components/ui/client-search-input';
import { ProductSearchInput } from '@/components/ui/product-search-input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useOptimizedQuery,
  useStaticQuery,
  useInvalidateRelated,
} from '@/hooks/use-optimized-query';
import { Loader2, Plus, Trash2, Package, Info } from 'lucide-react';

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface SaleFormData {
  client_id: string;
  affiliation_id?: string;
  items: SaleItem[];
}

interface SaleFormProps {
  saleId?: string;
  preselectedClientId?: string;
  onSuccess?: () => void;
}

interface PendingClient {
  name: string;
  tempId: string;
}

interface PendingProduct {
  name: string;
  tempId: string;
}

export const SaleForm = ({
  saleId,
  preselectedClientId,
  onSuccess,
}: SaleFormProps) => {
  const [selectedClient, setSelectedClient] = useState<string>(
    preselectedClientId || ''
  );
  const [selectedAffiliation, setSelectedAffiliation] = useState<string>('');
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [addedItems, setAddedItems] = useState<SaleItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  const { invalidateSalesData } = useInvalidateRelated();
  const { control, handleSubmit, reset } = useForm<SaleFormData>({
    defaultValues: {
      items: [],
    },
  });

  const total = addedItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  // Fetch clients with optimized caching
  const { data: clients = [] } = useOptimizedQuery(['clients'], async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .select(
        `
          *,
          affiliations (id, name)
        `
      )
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  });

  // Fetch products with static caching (they change less frequently)
  const { data: products = [] } = useStaticQuery(['products'], async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  });

  // Auto-set affiliation when client changes
  useEffect(() => {
    const client = clients.find((c) => c.id === selectedClient);
    if (client?.affiliations?.id) {
      setSelectedAffiliation(client.affiliations.id);
    } else {
      setSelectedAffiliation('');
    }
  }, [selectedClient, clients]);

  // Handle client creation
  const handleCreateClient = (clientName: string) => {
    const tempId = `temp_client_${Date.now()}`;
    const newClient: PendingClient = { name: clientName, tempId };
    setPendingClients((prev) => [...prev, newClient]);
    setSelectedClient(tempId);
  };

  // Handle product creation
  const handleCreateProduct = (productName: string) => {
    const tempId = `temp_product_${Date.now()}`;
    const newProduct: PendingProduct = { name: productName, tempId };
    setPendingProducts((prev) => [...prev, newProduct]);
    return tempId;
  };

  // Auto-fill price when product changes
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setCurrentProduct(productId);
      setCurrentPrice(Number(product.price));
    } else {
      setCurrentProduct(productId);
      if (!currentPrice) {
        setCurrentPrice(0);
      }
    }
  };

  // Add product to list
  const handleAddProduct = () => {
    if (!currentProduct) {
      toast({
        title: 'Erro',
        description: 'Selecione um produto.',
        variant: 'destructive',
      });
      return;
    }

    if (currentQuantity <= 0) {
      toast({
        title: 'Erro',
        description: 'A quantidade deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (currentPrice < 0) {
      toast({
        title: 'Erro',
        description: 'O preço deve ser maior ou igual a zero.',
        variant: 'destructive',
      });
      return;
    }

    const newItem: SaleItem = {
      product_id: currentProduct,
      quantity: currentQuantity,
      unit_price: currentPrice,
    };

    setAddedItems(prev => [...prev, newItem]);
    
    // Clear current product form
    setCurrentProduct('');
    setCurrentQuantity(1);
    setCurrentPrice(0);
    
    toast({
      title: 'Produto adicionado',
      description: 'O produto foi adicionado à venda.',
    });
  };

  // Remove product from list
  const handleRemoveItem = (index: number) => {
    setAddedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Get all clients including pending ones
  const allClients = [
    ...clients,
    ...pendingClients.map((pc) => ({
      id: pc.tempId,
      name: pc.name,
      affiliations: null,
    })),
  ];

  // Get all products including pending ones
  const allProducts = [
    ...products,
    ...pendingProducts.map((pp) => ({
      id: pp.tempId,
      name: pp.name,
      price: 0,
      unit: null,
    })),
  ];

  // Get product name for display
  const getProductName = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!selectedClient) {
        throw new Error('Selecione um cliente');
      }

      if (addedItems.length === 0) {
        throw new Error('Adicione pelo menos um produto');
      }

      let finalClientId = selectedClient;
      let createdProductIds: Record<string, string> = {};

      // Create pending client if needed
      const pendingClient = pendingClients.find(
        (pc) => pc.tempId === selectedClient
      );
      if (pendingClient) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: pendingClient.name,
            user_id: user.id,
          })
          .select()
          .single();

        if (clientError) throw clientError;
        finalClientId = newClient.id;
      }

      // Create pending products if needed
      const itemsWithPendingProducts = addedItems.filter((item) =>
        pendingProducts.some((pp) => pp.tempId === item.product_id)
      );

      for (const item of itemsWithPendingProducts) {
        const pendingProduct = pendingProducts.find(
          (pp) => pp.tempId === item.product_id
        );
        if (pendingProduct) {
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              name: pendingProduct.name,
              price: item.unit_price,
              user_id: user.id,
            })
            .select()
            .single();

          if (productError) throw productError;
          createdProductIds[item.product_id] = newProduct.id;
        }
      }

      // Create sale - user_id still needed for sales table
      const createdAtIso = new Date().toISOString();
      const createdAtUtcMicros = createdAtIso
        .replace('Z', '+00:00')
        .replace(/\.(\d{3})\+00:00$/, '.$1000+00:00');

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          client_id: finalClientId,
          affiliation_id: selectedAffiliation || null,
          total: 0, // Will be calculated by trigger
          created_at: createdAtUtcMicros,
        })
        .select()
        .single();

      if (saleError) {
        if (
          saleError.message.includes(
            'new row violates row-level security policy'
          )
        ) {
          throw new Error(
            'Não é possível criar uma venda para um cliente ou afiliação que não pertence a você.'
          );
        }
        throw saleError;
      }

      // Create sale items
      const saleItems = addedItems.map((item) => ({
        sale_id: sale.id,
        product_id: createdProductIds[item.product_id] || item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        user_id: user.id,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        if (
          itemsError.message.includes(
            'new row violates row-level security policy'
          )
        ) {
          throw new Error(
            'Não é possível usar produtos que não pertencem a você.'
          );
        }
        if (
          itemsError.message.includes('check_sale_items_quantity_non_negative')
        ) {
          throw new Error('A quantidade deve ser maior ou igual a zero.');
        }
        if (
          itemsError.message.includes(
            'check_sale_items_unit_price_non_negative'
          )
        ) {
          throw new Error('O preço unitário deve ser maior ou igual a zero.');
        }
        throw itemsError;
      }
    },
    onSuccess: () => {
      invalidateSalesData();
      toast({
        title: 'Venda registrada!',
        description: 'A venda foi registrada com sucesso.',
      });
      reset({
        items: [],
      });
      setSelectedClient('');
      setSelectedAffiliation('');
      setPendingClients([]);
      setPendingProducts([]);
      setAddedItems([]);
      setCurrentProduct('');
      setCurrentQuantity(1);
      setCurrentPrice(0);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível registrar a venda.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = () => {
    mutation.mutate();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <Card className='py-4'>
      <CardContent className='mobile-form'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Client Selection */}
          <div className='space-y-2'>
            <Label>Cliente *</Label>
            <ClientSearchInput
              clients={allClients}
              value={selectedClient}
              onValueChange={setSelectedClient}
              onCreateNew={handleCreateClient}
              placeholder='Digite o nome do cliente'
              className='mobile-input'
            />

            <p className='text-sm text-gray-400 mt-1 flex items-center'>
              <Info className='w-4 h-4 mr-2' />
              Para cadastrar um novo cliente, basta digitar o nome no campo
              acima.
            </p>
          </div>

          {/* Product Form */}
          <div className='space-y-4'>
            <Label>Adicionar Produto *</Label>
            
            <Card className='p-4'>
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <Label>Produto</Label>
                  <ProductSearchInput
                    products={allProducts}
                    value={currentProduct}
                    onValueChange={handleProductChange}
                    onCreateNew={(productName) => {
                      const tempId = handleCreateProduct(productName);
                      handleProductChange(tempId);
                    }}
                    placeholder='Digite o nome do produto'
                    className='mobile-input'
                  />
                  <p className='text-sm text-gray-400 mt-1 flex items-center'>
                    <Info className='w-4 h-4 mr-2' />
                    Para cadastrar um novo produto, basta digitar o nome no
                    campo acima.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type='number'
                      min='1'
                      value={currentQuantity}
                      onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                      className='mobile-input'
                    />
                  </div>

                  <div>
                    <Label>Preço unitário</Label>
                    <MoneyInput
                      className='mobile-input'
                      placeholder='R$ 0,00'
                      value={currentPrice}
                      onValueChange={setCurrentPrice}
                    />
                  </div>
                </div>

                <div className='text-right'>
                  <span className='text-sm text-muted-foreground'>
                    Subtotal:{' '}
                  </span>
                  <span className='font-medium'>
                    {formatCurrency(currentQuantity * currentPrice)}
                  </span>
                </div>

                <Button
                  type='button'
                  onClick={handleAddProduct}
                  className='w-full mobile-tap'
                  disabled={!currentProduct}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Adicionar Produto
                </Button>
              </div>
            </Card>
          </div>

          {/* Added Products List */}
          {addedItems.length > 0 && (
            <div className='space-y-4'>
              <Label>Produtos Adicionados ({addedItems.length})</Label>
              
              <div className='space-y-3'>
                {addedItems.map((item, index) => (
                  <Card key={index} className='p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-medium'>{getProductName(item.product_id)}</h4>
                        <div className='text-sm text-muted-foreground mt-1'>
                          Quantidade: {item.quantity} | Preço: {formatCurrency(item.unit_price)}
                        </div>
                        <div className='font-medium mt-1'>
                          Subtotal: {formatCurrency(item.quantity * item.unit_price)}
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveItem(index)}
                        className='mobile-tap text-destructive'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {addedItems.length === 0 && (
            <Card className='p-6 text-center'>
              <Package className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <p className='text-muted-foreground'>
                Nenhum produto adicionado à venda
              </p>
            </Card>
          )}

          {/* Total */}
          <Card className='bg-primary/5'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center justify-between'>
                <span>Total da Venda</span>
                <span className='text-2xl font-bold text-primary'>
                  {formatCurrency(total)}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Button
            type='submit'
            disabled={mutation.isPending || !selectedClient || addedItems.length === 0}
            className='mobile-button w-full mobile-tap'
          >
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Registrar Venda
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};