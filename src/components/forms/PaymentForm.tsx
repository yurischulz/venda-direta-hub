import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const paymentSchema = z.object({
  client_id: z.string().min(1, "Cliente é obrigatório"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  paid_at: z.string().min(1, "Data é obrigatória"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  preselectedClientId?: string;
  onSuccess?: () => void;
}

export function PaymentForm({ preselectedClientId, onSuccess }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      client_id: preselectedClientId || "",
      amount: 0,
      paid_at: new Date().toISOString().split("T")[0],
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      // Triggers now automatically set user_id, so we don't need to manually set it
      const { error } = await supabase.from("payments").insert({
        client_id: data.client_id,
        amount: data.amount,
        paid_at: data.paid_at,
        user_id: '', // Will be overridden by trigger
      });

      if (error) {
        // Provide helpful error messages for common security policy violations
        if (error.message.includes('new row violates row-level security policy')) {
          throw new Error("Não é possível criar um recebimento para um cliente que não pertence a você.");
        }
        if (error.message.includes('check_payments_amount_positive')) {
          throw new Error("O valor do recebimento deve ser maior que zero.");
        }
        throw error;
      }

      toast({
        title: "Recebimento registrado",
        description: "O recebimento foi registrado com sucesso.",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      let errorMessage = "Erro ao registrar recebimento.";
      
      if (error.message.includes('new row violates row-level security policy')) {
        errorMessage = "Não é possível criar um recebimento para um cliente que não pertence a você.";
      } else if (error.message.includes('check_payments_amount_positive')) {
        errorMessage = "O valor do recebimento deve ser maior que zero.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="R$ 0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paid_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Recebimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Salvando..." : "Salvar Recebimento"}
        </Button>
      </form>
    </Form>
  );
}