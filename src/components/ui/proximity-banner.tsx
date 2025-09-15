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

export const ProximityBanner = ({
  nearbyLocations,
  onClose,
}: ProximityBannerProps) => {
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState(
    nearbyLocations[0]?.id || ''
  );

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const selectedLocation = nearbyLocations.find(
    (loc) => loc.id === selectedLocationId
  );

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
    <div className='mb-4'>
      <div className='bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg relative'>
        {/* Close button */}
        <Button
          variant='ghost'
          size='sm'
          className='absolute top-2 right-2 h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20'
          onClick={onClose}
        >
          <X className='h-4 w-4' />
        </Button>

        {/* Icon and main content */}
        <div className='flex items-start gap-3 pr-8'>
          <div className='flex-shrink-0 mt-1'>
            <div className='bg-primary-foreground/20 rounded-full p-2'>
              <MapPin className='h-5 w-5 text-primary-foreground' />
            </div>
          </div>

          <div className='flex-1 space-y-3'>
            <div>
              <p className='text-primary-foreground font-medium'>
                Você está próximo a {nearbyLocations.length}{' '}
                {nearbyLocations.length === 1
                  ? 'localização cadastrada'
                  : 'localizações cadastradas'}
                .
              </p>
              <p className='text-primary-foreground/90 text-sm mt-1'>
                Filtrar por uma localização específica?
              </p>
            </div>
          </div>
        </div>

        {/* Location selection */}
        <div className='space-y-2'>
          {nearbyLocations.map((location) => (
            <div
              key={location.id}
              className={`bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                selectedLocationId === location.id
                  ? 'bg-primary-foreground/20 ring-2 ring-primary-foreground/30'
                  : 'hover:bg-primary-foreground/15'
              }`}
              onClick={() => handleLocationSelect(location.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='flex flex-col'>
                    <span className='text-primary-foreground font-medium text-sm'>
                      {location.name}
                    </span>
                    <span className='text-primary-foreground/80 text-xs'>
                      {location.type === 'affiliation'
                        ? 'Afiliação'
                        : 'Cliente'}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='secondary'
                    className='text-xs bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                  >
                    {formatDistance(location.distance)}
                  </Badge>
                  {selectedLocationId === location.id && (
                    <div className='w-2 h-2 bg-primary-foreground rounded-full'></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            variant='secondary'
            size='sm'
            onClick={handleFilter}
            className='bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30 backdrop-blur-sm'
            disabled={!selectedLocationId}
          >
            FILTRAR
          </Button>
        </div>
      </div>
    </div>
  );
};
