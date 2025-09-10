import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NearbyAffiliation {
  id: string;
  name: string;
  distance: number;
}

interface AffiliationProximityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nearbyAffiliations: NearbyAffiliation[];
  allAffiliations: Array<{ id: string; name: string }>;
}

export const AffiliationProximityModal = ({
  open,
  onOpenChange,
  nearbyAffiliations,
  allAffiliations
}: AffiliationProximityModalProps) => {
  // Pré-seleciona o primeiro registro próximo ou o primeiro da lista
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(() => {
    if (nearbyAffiliations.length > 0) {
      return nearbyAffiliations[0].id;
    }
    if (allAffiliations.length > 0) {
      return allAffiliations[0].id;
    }
    return null;
  });
  const navigate = useNavigate();

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const handleContinueWithFilter = () => {
    if (selectedAffiliation) {
      navigate(`/customer-accounts?affiliation=${selectedAffiliation}`);
    } else {
      navigate('/customer-accounts');
    }
    onOpenChange(false);
  };

  const handleContinueWithoutFilter = () => {
    navigate('/customer-accounts');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Você está próximo de uma afiliação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione uma afiliação para filtrar o crediário ou visualize todos os registros.
            {nearbyAffiliations.length > 0 && (
              <span className="block mt-1 text-primary">
                📍 Detectamos afiliações próximas à sua localização
              </span>
            )}
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Opções de filtro:</label>
            
            <div 
              className="p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:bg-muted/50"
              onClick={() => setSelectedAffiliation(null)}
            >
              <div className={`flex items-center justify-between ${
                selectedAffiliation === null ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Todas as afiliações</span>
                </div>
                {selectedAffiliation === null && (
                  <Badge variant="default" className="text-xs">Selecionado</Badge>
                )}
              </div>
            </div>

            {nearbyAffiliations.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Afiliações próximas:</label>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{affiliation.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-primary">
                          {formatDistance(affiliation.distance)}
                        </Badge>
                        {selectedAffiliation === affiliation.id && (
                          <Badge variant="default" className="text-xs">Selecionado</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allAffiliations.filter(aff => !nearbyAffiliations.find(nearby => nearby.id === aff.id)).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Outras afiliações:</label>
                {allAffiliations
                  .filter(aff => !nearbyAffiliations.find(nearby => nearby.id === aff.id))
                  .map((affiliation) => (
                    <div
                      key={affiliation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedAffiliation === affiliation.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                      }`}
                      onClick={() => setSelectedAffiliation(affiliation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{affiliation.name}</span>
                        </div>
                        {selectedAffiliation === affiliation.id && (
                          <Badge variant="default" className="text-xs">Selecionado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleContinueWithoutFilter}
            className="flex-1"
          >
            Continuar sem filtro
          </Button>
          <Button
            onClick={handleContinueWithFilter}
            className="flex-1"
          >
            {selectedAffiliation ? 'Filtrar por afiliação' : 'Ver todos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};