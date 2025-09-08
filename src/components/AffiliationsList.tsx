import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Phone,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatPhoneForDisplay } from '@/lib/phone-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Affiliation {
  id: string;
  name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AffiliationsListProps {
  showActions?: boolean;
  onEdit?: (affiliationId: string) => void;
  onNew?: () => void;
}

export const AffiliationsList = ({ 
  showActions = true, 
  onEdit, 
  onNew 
}: AffiliationsListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: affiliations, isLoading } = useQuery({
    queryKey: ['affiliations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('affiliations')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as Affiliation[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (affiliationId: string) => {
      const { error } = await supabase
        .from('affiliations')
        .delete()
        .eq('id', affiliationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliations'] });
      toast({
        title: 'Afiliação excluída!',
        description: 'A afiliação foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a afiliação.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (affiliationId: string) => {
    if (onEdit) {
      onEdit(affiliationId);
    } else {
      navigate(`/affiliations/${affiliationId}`);
    }
  };

  const handleNewAffiliation = () => {
    if (onNew) {
      onNew();
    } else {
      navigate('/affiliations/new');
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-4'>
              <Skeleton className='h-5 w-2/3 mb-2' />
              <Skeleton className='h-4 w-1/2' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Estatísticas */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Users className='h-5 w-5 text-primary' />
              </div>
              <div>
                <div className='text-2xl font-bold'>
                  {affiliations?.length || 0}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Total de Afiliações
                </div>
              </div>
            </div>
            {showActions && (
              <Button
                onClick={handleNewAffiliation}
                className='mobile-tap'
              >
                <Plus className='h-4 w-4 mr-2' />
                Nova
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Afiliações */}
      {!affiliations || affiliations.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <Users className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <h3 className='font-semibold mb-2'>Nenhuma afiliação cadastrada</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Cadastre a primeira afiliação para começar a gerenciar.
            </p>
            {showActions && (
              <Button 
                onClick={handleNewAffiliation} 
                className='mobile-tap'
              >
                <Plus className='h-4 w-4 mr-2' />
                Nova Afiliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {affiliations.map((affiliation) => (
            <Card key={affiliation.id}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-1'>
                      <h3 className='font-semibold'>{affiliation.name}</h3>
                    </div>
                    
                    {affiliation.phone && (
                      <div className='flex items-center space-x-2 text-sm text-muted-foreground mb-2'>
                        <Phone className='h-3 w-3' />
                        <span>{formatPhoneForDisplay(affiliation.phone)}</span>
                      </div>
                    )}
                    
                    <div className='text-xs text-muted-foreground'>
                      Criada em {formatDate(affiliation.created_at)}
                    </div>
                  </div>
                  
                  {showActions && (
                    <div className='flex items-center space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEdit(affiliation.id)}
                        className='mobile-tap h-8 w-8 p-0'
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='mobile-tap h-8 w-8 p-0 text-destructive hover:text-destructive'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className='flex items-center space-x-2'>
                              <AlertCircle className='h-5 w-5 text-destructive' />
                              <span>Confirmar exclusão</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a afiliação "{affiliation.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(affiliation.id)}
                              className='bg-destructive hover:bg-destructive/90'
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};