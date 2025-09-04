import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface AffiliationFormData {
  name: string;
  phone: string;
}

interface AffiliationFormProps {
  affiliationId?: string;
  onSuccess?: () => void;
}

export const AffiliationForm = ({
  affiliationId,
  onSuccess,
}: AffiliationFormProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } =
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
    }
  }, [affiliationData, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: AffiliationFormData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const affiliationData = {
        ...data,
        user_id: userId,
      };

      if (affiliationId) {
        const { error } = await supabase
          .from('affiliations')
          .update(affiliationData)
          .eq('id', affiliationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('affiliations')
          .insert(affiliationData);
        if (error) throw error;
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
            <MaskedInput
              id='phone'
              {...register('phone')}
              mask="(99) 99999-9999"
              className='mobile-input'
              placeholder='(11) 99999-9999'
              inputMode='numeric'
            />
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
