import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NearbyAffiliation {
  id: string;
  name: string;
  distance: number;
  type: 'affiliation' | 'client';
}

interface AffiliationProximityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nearbyAffiliations: NearbyAffiliation[];
  onInteraction?: () => void;
}

export const AffiliationProximityModal = ({
  open,
  onOpenChange,
  nearbyAffiliations,
  onInteraction,
}: AffiliationProximityModalProps) => {
  // Pré-seleciona o primeiro registro próximo (mais próximo)
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(
    null
  );

  // Atualiza a seleção quando nearbyAffiliations mudar
  useEffect(() => {
    if (nearbyAffiliations.length > 0) {
      setSelectedAffiliation(nearbyAffiliations[0].id);
    } else {
      setSelectedAffiliation(null);
    }
  }, [nearbyAffiliations]);
  const navigate = useNavigate();

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const handleContinueWithFilter = () => {
    onInteraction?.();
    if (selectedAffiliation) {
      const selectedLocation = nearbyAffiliations.find(
        (item) => item.id === selectedAffiliation
      );
      if (selectedLocation?.type === 'affiliation') {
        navigate(`/customer-accounts?affiliation=${selectedAffiliation}`);
      } else {
        navigate(`/customer-accounts?client=${selectedAffiliation}`);
      }
    }
    onOpenChange(false);
  };

  const handleContinueWithoutFilter = () => {
    onInteraction?.();
    navigate('/customer-accounts');
    onOpenChange(false);
  };

  const handleRemoveLocationFilter = () => {
    onInteraction?.();
    navigate('/customer-accounts');
    onOpenChange(false);
  };

  // Função para lidar com o fechamento da modal (ESC ou clique fora)
  const handleModalClose = (open: boolean) => {
    if (!open) {
      onInteraction?.();
      // Ao fechar a modal, continua sem filtro
      navigate('/customer-accounts');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className='max-w-[95vw] max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-primary' />
            Localização próxima detectada
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Detectamos que você está próximo a localizações cadastradas. Deseja
            filtrar por uma localização específica?
          </p>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-primary'>
              Localizações próximas:
            </label>
            {nearbyAffiliations.map((affiliation) => (
              <div
                key={affiliation.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                  selectedAffiliation === affiliation.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
                onClick={() => setSelectedAffiliation(affiliation.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-primary' />
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>
                        {affiliation.name}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {affiliation.type === 'affiliation'
                          ? 'Afiliação'
                          : 'Cliente'}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs text-primary'>
                      {formatDistance(affiliation.distance)}
                    </Badge>
                    {selectedAffiliation === affiliation.id && (
                      <Badge variant='default' className='text-xs'>
                        Selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          {(() => {
            const selectedLocation = nearbyAffiliations.find(
              (item) => item.id === selectedAffiliation
            );
            const isClientSelected = selectedLocation?.type === 'client';

            if (isClientSelected) {
              return (
                <>
                  <Button
                    variant='outline'
                    onClick={handleContinueWithoutFilter}
                    className='flex-1'
                  >
                    Continuar sem filtro
                  </Button>
                  <Button
                    onClick={handleContinueWithFilter}
                    className='flex-1'
                    disabled={!selectedAffiliation}
                  >
                    Filtrar por cliente
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={handleRemoveLocationFilter}
                    className='flex-1'
                  >
                    Remover filtro
                  </Button>
                </>
              );
            }

            return (
              <>
                <Button
                  onClick={handleContinueWithFilter}
                  className='flex-1'
                  disabled={!selectedAffiliation}
                >
                  Filtrar por afiliação
                </Button>
                <Button
                  variant='outline'
                  onClick={handleContinueWithoutFilter}
                  className='flex-1'
                >
                  Continuar sem filtro
                </Button>
              </>
            );
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
