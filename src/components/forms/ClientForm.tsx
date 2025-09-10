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
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';

interface ClientFormData {
  name: string;
  phone: string;
  cpf: string;
  email: string;
  cep: string;
  address: string;
  address_number: string;
  address_complement: string;
  affiliation_id?: string;
  latitude?: number;
  longitude?: number;
}

interface ClientFormProps {
  clientId?: string;
  onSuccess?: () => void;
}

export const ClientForm = ({ clientId, onSuccess }: ClientFormProps) => {
  const [selectedAffiliation, setSelectedAffiliation] =
    useState<string>('none');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [lastSearchedCep, setLastSearchedCep] = useState<string>('');
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
      setValue('cep', (clientData as any).cep || '');
      setValue('address', clientData.address || '');
      setValue('address_number', (clientData as any).address_number || '');
      setValue('address_complement', (clientData as any).address_complement || '');
      setSelectedAffiliation(clientData.affiliation_id || 'none');
      setLatitude((clientData as any).latitude || 0);
      setLongitude((clientData as any).longitude || 0);
    }
  }, [clientData, setValue]);

  const formatCep = (value: string) => {
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length <= 5) {
      return cleanCep;
    }
    return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
  };

  const searchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;
    
    // Verificar se já buscamos esse CEP recentemente para permitir nova busca
    setLastSearchedCep(cleanCep);
    setIsLoadingCep(true);
    
    try {
      // Buscar CEP via ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique se o CEP está correto e tente novamente.',
          variant: 'destructive',
        });
        return;
      }
      
      // Preencher campos automaticamente
      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
      setValue('address', fullAddress);
      
      // Buscar coordenadas no Nominatim
      const searchQuery = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}&countrycodes=br`
      );
      
      const nominatimData = await nominatimResponse.json();
      
      if (nominatimData.length > 0) {
        const lat = parseFloat(nominatimData[0].lat);
        const lng = parseFloat(nominatimData[0].lon);
        setLatitude(lat);
        setLongitude(lng);
      }
      
      toast({
        title: 'Endereço localizado!',
        description: 'Preenchemos automaticamente as informações de endereço.',
      });
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Ops, algo deu errado',
        description: 'Não conseguimos buscar o endereço. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedCep = formatCep(value);
    setValue('cep', formattedCep);
    
    // Auto-buscar quando o CEP estiver completo
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      searchAddressByCep(value);
    }
  };

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
        latitude: latitude || null,
        longitude: longitude || null,
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
        setLatitude(0);
        setLongitude(0);
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
            <Label htmlFor='cep'>CEP *</Label>
            <div className='text-xs text-muted-foreground mb-2'>
              🏠 Digite seu CEP e encontraremos o endereço automaticamente
            </div>
            <Input
              id='cep'
              {...register('cep')}
              onChange={handleCepChange}
              className='mobile-input'
              placeholder='00000-000'
              maxLength={9}
            />
            {isLoadingCep && (
              <div className='text-xs text-primary flex items-center'>
                <Loader2 className='h-3 w-3 animate-spin mr-1' />
                Localizando seu endereço...
              </div>
            )}
          </div>

          <AddressAutocomplete
            value={clientData?.address || ''}
            onAddressSelect={(address, lat, lng) => {
              setValue('address', address);
              setLatitude(lat);
              setLongitude(lng);
            }}
            placeholder='Digite o endereço para buscar...'
          />

          <div className="grid grid-cols-2 gap-4">
            <div className='space-y-2'>
              <Label htmlFor='address_number'>Número</Label>
              <Input
                id='address_number'
                {...register('address_number')}
                className='mobile-input'
                placeholder='123'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address_complement'>Complemento</Label>
              <Input
                id='address_complement'
                {...register('address_complement')}
                className='mobile-input'
                placeholder='Apto 45, Bloco B'
              />
            </div>
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
