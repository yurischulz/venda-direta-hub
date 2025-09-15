import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface NearbyLocation {
  id: string;
  name: string;
  distance: number;
  type: 'affiliation' | 'client';
}

interface ProximityBannerProps {
  nearbyLocations: NearbyLocation[];
  onClose: () => void;
}

export const ProximityBanner = ({ nearbyLocations, onClose }: ProximityBannerProps) => {
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState(nearbyLocations[0]?.id || '');
  
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const selectedLocation = nearbyLocations.find(loc => loc.id === selectedLocationId);
  
  const handleFilter = () => {
    if (selectedLocation) {
      if (selectedLocation.type === 'affiliation') {
        navigate(`/customer-accounts?affiliation=${selectedLocationId}`);
      } else {
        navigate(`/customer-accounts?client=${selectedLocationId}`);
      }
    }
    onClose();
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  if (!nearbyLocations.length) return null;

  return (
    <div className="mx-4 mb-4">
      <div className="bg-green-600/90 text-white rounded-2xl p-4 shadow-lg relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon and main content */}
        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 mt-1">
            <div className="bg-white/20 rounded-full p-2">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-white font-medium">
                Você está próximo a {nearbyLocations.length} {nearbyLocations.length === 1 ? 'localização cadastrada' : 'localizações cadastradas'}.
              </p>
              <p className="text-white/90 text-sm mt-1">
                Filtrar o crediário por uma localização específica?
              </p>
            </div>

            {/* Location selection */}
            <div className="space-y-2">
              {nearbyLocations.map((location) => (
                <div
                  key={location.id}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                    selectedLocationId === location.id ? 'bg-white/20 ring-2 ring-white/30' : 'hover:bg-white/15'
                  }`}
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{location.name}</span>
                        <span className="text-white/80 text-xs">
                          {location.type === 'affiliation' ? 'Afiliação' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                        {formatDistance(location.distance)}
                      </Badge>
                      {selectedLocationId === location.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFilter}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                disabled={!selectedLocationId}
              >
                Filtrar por {selectedLocation?.type === 'affiliation' ? 'afiliação' : 'cliente'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                Continuar sem filtro
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};