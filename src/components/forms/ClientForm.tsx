import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { CpfInput } from '@/components/ui/cpf-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface ClientFormData {
  name: string;
  phone: string;
  cpf: string;
  email: string;
  address: string;
  affiliation_id?: string;
}

interface ClientFormProps {
  clientId?: string;
  onSuccess?: () => void;
}

export const ClientForm = ({ clientId, onSuccess }: ClientFormProps) => {
  const [selectedAffiliation, setSelectedAffiliation] =
    useState<string>('none');
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, control } =
    useForm<ClientFormData>();

  // Fetch affiliations for select
  const { data: affiliations = [] } = useQuery({
    queryKey: ['affiliations'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('affiliations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
  });

  // Fetch client data if editing
  const { data: clientData } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Set form values when editing
  useEffect(() => {
    if (clientData) {
      setValue('name', clientData.name);
      setValue('phone', clientData.phone || '');
      setValue('cpf', clientData.cpf || '');
      setValue('email', clientData.email || '');
      setValue('address', clientData.address || '');
      setSelectedAffiliation(clientData.affiliation_id || 'none');
    }
  }, [clientData, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const clientData = {
        ...data,
        user_id: user.id, // Still needed since no trigger sets this
        affiliation_id:
          selectedAffiliation === 'none' ? null : selectedAffiliation || null,
      };

      if (clientId) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId);

        if (error) {
          if (
            error.message.includes('new row violates row-level security policy')
          ) {
            throw new Error(
              'Não é possível atualizar dados de cliente que não pertence a você.'
            );
          }
          throw error;
        }
      } else {
        const { error } = await supabase.from('clients').insert(clientData);

        if (error) {
          if (
            error.message.includes('new row violates row-level security policy')
          ) {
            throw new Error(
              'Não é possível criar cliente com dados que não pertencem a você.'
            );
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: clientId ? 'Cliente atualizado!' : 'Cliente criado!',
        description: 'As informações foram salvas com sucesso.',
      });
      if (!clientId) {
        reset();
        setSelectedAffiliation('none');
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cliente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className='mobile-form'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Nome *</Label>
            <Input
              id='name'
              {...register('name', { required: true })}
              className='mobile-input'
              placeholder='Nome completo do cliente'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Telefone</Label>
            <Controller
              name='phone'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <PhoneInput
                  id='phone'
                  value={field.value}
                  onValueChange={field.onChange}
                  className='mobile-input'
                  placeholder='(11) 99999-9999'
                />
              )}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cpf'>CPF</Label>
            <Controller
              name='cpf'
              control={control}
              render={({ field }) => (
                <CpfInput
                  id='cpf'
                  value={field.value}
                  onValueChange={field.onChange}
                  className='mobile-input'
                  placeholder='000.000.000-00'
                />
              )}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              {...register('email')}
              className='mobile-input'
              placeholder='cliente@email.com'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Endereço</Label>
            <Input
              id='address'
              {...register('address')}
              className='mobile-input'
              placeholder='Endereço completo'
            />
          </div>

          <div className='space-y-2'>
            <Label>Afiliação</Label>
            <Select
              value={selectedAffiliation}
              onValueChange={setSelectedAffiliation}
            >
              <SelectTrigger className='mobile-input'>
                <SelectValue placeholder='Selecione uma afiliação (opcional)' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Nenhuma</SelectItem>
                {affiliations.map((affiliation) => (
                  <SelectItem key={affiliation.id} value={affiliation.id}>
                    {affiliation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type='submit'
            disabled={mutation.isPending}
            className='mobile-button w-full mobile-tap'
          >
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            {clientId ? 'Atualizar Cliente' : 'Salvar Cliente'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
