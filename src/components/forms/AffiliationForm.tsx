import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AffiliationFormData {
  name: string;
  phone: string;
  cep: string;
  address: string;
  address_number: string;
  address_complement: string;
  latitude?: number;
  longitude?: number;
}

interface AffiliationFormProps {
  affiliationId?: string;
  onSuccess?: () => void;
}

export const AffiliationForm = ({
  affiliationId,
  onSuccess,
}: AffiliationFormProps) => {
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [lastSearchedCep, setLastSearchedCep] = useState<string>('');
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, control } =
    useForm<AffiliationFormData>();

  // Fetch affiliation data if editing
  const { data: affiliationData } = useQuery({
    queryKey: ['affiliation', affiliationId],
    queryFn: async () => {
      if (!affiliationId) return null;
      const { data, error } = await supabase
        .from('affiliations')
        .select('*')
        .eq('id', affiliationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!affiliationId,
  });

  // Set form values when editing
  useEffect(() => {
    if (affiliationData) {
      setValue('name', affiliationData.name);
      setValue('phone', affiliationData.phone || '');
      setValue('cep', (affiliationData as any).cep || '');
      setValue('address', (affiliationData as any).address || '');
      setValue('address_number', (affiliationData as any).address_number || '');
      setValue('address_complement', (affiliationData as any).address_complement || '');
      setLatitude((affiliationData as any).latitude || 0);
      setLongitude((affiliationData as any).longitude || 0);
    }
  }, [affiliationData, setValue]);

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
      console.log('Setting address:', fullAddress); // Debug log
      
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
    mutationFn: async (data: AffiliationFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const affiliationData = {
        ...data,
        user_id: user.id, // Still needed since no trigger sets this
        latitude: latitude || null,
        longitude: longitude || null,
      };

      if (affiliationId) {
        const { error } = await supabase
          .from('affiliations')
          .update(affiliationData)
          .eq('id', affiliationId);
          
        if (error) {
          if (error.message.includes('new row violates row-level security policy')) {
            throw new Error("Não é possível atualizar dados de afiliação que não pertence a você.");
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('affiliations')
          .insert(affiliationData);
          
        if (error) {
          if (error.message.includes('new row violates row-level security policy')) {
            throw new Error("Erro de permissão ao criar afiliação.");
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliations'] });
      toast({
        title: affiliationId ? 'Afiliação atualizada!' : 'Afiliação criada!',
        description: 'As informações foram salvas com sucesso.',
      });
      if (!affiliationId) {
        reset();
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a afiliação.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AffiliationFormData) => {
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
              placeholder='Nome da afiliação'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Telefone</Label>
            <Controller
              name='phone'
              control={control}
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
            <Label htmlFor='cep'>CEP *</Label>
            <div className='text-xs text-muted-foreground mb-2'>
              🏠 Digite seu CEP e encontraremos o endereço automaticamente
            </div>
            <div className="relative">
              <Input
                id='cep'
                {...register('cep')}
                onChange={handleCepChange}
                className='mobile-input pr-10'
                placeholder='00000-000'
                maxLength={9}
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {isLoadingCep && (
              <div className='text-xs text-primary flex items-center'>
                <Loader2 className='h-3 w-3 animate-spin mr-1' />
                Localizando seu endereço...
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Endereço</Label>
            <Input
              id='address'
              {...register('address')}
              className='mobile-input'
              placeholder='Rua, Bairro, Cidade, Estado'
            />
          </div>

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

          <Button
            type='submit'
            disabled={mutation.isPending}
            className='mobile-button w-full mobile-tap'
          >
            {mutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            {affiliationId ? 'Atualizar Afiliação' : 'Salvar Afiliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
