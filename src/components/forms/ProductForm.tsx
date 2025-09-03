import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProductFormData {
  name: string;
  price: string;
  description: string;
  unit: string;
}

interface ProductFormProps {
  productId?: string;
  onSuccess?: () => void;
}

export const ProductForm = ({ productId, onSuccess }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<ProductFormData>();

  // Fetch product data if editing
  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  // Set form values when editing
  useEffect(() => {
    if (productData) {
      setValue('name', productData.name);
      setValue('price', productData.price.toString());
      setValue('description', productData.description || '');
      setValue('unit', productData.unit || '');
    }
  }, [productData, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const productData = {
        name: data.name,
        price: parseFloat(data.price) || 0,
        description: data.description,
        unit: data.unit,
        user_id: userId
      };

      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: productId ? "Produto atualizado!" : "Produto criado!",
        description: "As informações foram salvas com sucesso."
      });
      if (!productId) {
        reset();
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o produto.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className="mobile-form">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              className="mobile-input"
              placeholder="Nome do produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { required: true })}
              className="mobile-input"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              {...register("unit")}
              className="mobile-input"
              placeholder="Un, Kg, L, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              className="min-h-20"
              placeholder="Descrição do produto (opcional)"
            />
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="mobile-button w-full mobile-tap"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productId ? "Atualizar Produto" : "Salvar Produto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};