import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Package } from "lucide-react";

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
  onSuccess?: () => void;
}

export const SaleForm = ({ saleId, onSuccess }: SaleFormProps) => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAffiliation, setSelectedAffiliation] = useState<string>("");
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, watch, setValue } = useForm<SaleFormData>({
    defaultValues: {
      items: [{ product_id: "", quantity: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const total = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          affiliations (id, name)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    }
  });

  // Auto-set affiliation when client changes
  useEffect(() => {
    const client = clients.find(c => c.id === selectedClient);
    if (client?.affiliations?.id) {
      setSelectedAffiliation(client.affiliations.id);
    } else {
      setSelectedAffiliation("");
    }
  }, [selectedClient, clients]);

  // Auto-fill price when product changes
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.unit_price`, product.price);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      if (!selectedClient) {
        throw new Error('Selecione um cliente');
      }

      if (data.items.length === 0 || !data.items.some(item => item.product_id)) {
        throw new Error('Adicione pelo menos um produto');
      }

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: userId,
          client_id: selectedClient,
          affiliation_id: selectedAffiliation || null,
          total: 0 // Will be calculated by trigger
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = data.items
        .filter(item => item.product_id)
        .map(item => ({
          user_id: userId,
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Venda registrada!",
        description: "A venda foi registrada com sucesso."
      });
      reset({
        items: [{ product_id: "", quantity: 1, unit_price: 0 }]
      });
      setSelectedClient("");
      setSelectedAffiliation("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a venda.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SaleFormData) => {
    mutation.mutate(data);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Card>
      <CardContent className="mobile-form">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="mobile-input">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      {client.affiliations && (
                        <div className="text-xs text-muted-foreground">
                          {client.affiliations.name}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produtos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                className="mobile-tap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Produto
              </Button>
            </div>

            {fields.length === 0 && (
              <Card className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum produto adicionado</p>
                <Button
                  type="button"
                  onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                  className="mobile-tap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </Card>
            )}

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Produto {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mobile-tap text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Produto</Label>
                    <Select
                      value={watchedItems[index]?.product_id || ""}
                      onValueChange={(value) => handleProductChange(index, value)}
                    >
                      <SelectTrigger className="mobile-input">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(Number(product.price))}
                                {product.unit && ` por ${product.unit}`}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        defaultValue={field.quantity}
                        className="mobile-input"
                        {...control.register(`items.${index}.quantity`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>

                    <div>
                      <Label>Preço unitário</Label>
                      <Controller
                        name={`items.${index}.unit_price`}
                        control={control}
                        render={({ field }) => (
                          <MoneyInput
                            className="mobile-input"
                            placeholder="R$ 0,00"
                            value={field.value}
                            onValueChange={(value) => field.onChange(parseFloat(value || "0") || 0)}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Subtotal: </span>
                    <span className="font-medium">
                      {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0))}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Total */}
          <Card className="bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Total da Venda</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(total)}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Button 
            type="submit" 
            disabled={mutation.isPending || !selectedClient || total === 0}
            className="mobile-button w-full mobile-tap"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Venda
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};