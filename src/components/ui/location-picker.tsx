import { useState } from 'react';
import { MapPin, Navigation, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from '@/components/ui/use-toast';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (latitude: number, longitude: number) => void;
  label?: string;
  required?: boolean;
}

export function LocationPicker({
  latitude = 0,
  longitude = 0,
  onLocationChange,
  label = 'Localização',
  required = false,
}: LocationPickerProps) {
  const [localLat, setLocalLat] = useState(latitude);
  const [localLng, setLocalLng] = useState(longitude);
  const [copied, setCopied] = useState(false);
  
  const { getCurrentPosition, loading } = useGeolocation();

  const handleGetCurrentLocation = async () => {
    const position = await getCurrentPosition();
    if (position) {
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;
      setLocalLat(newLat);
      setLocalLng(newLng);
      onLocationChange?.(newLat, newLng);
    }
  };

  const handleLatitudeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalLat(numValue);
      onLocationChange?.(numValue, localLng);
    }
  };

  const handleLongitudeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalLng(numValue);
      onLocationChange?.(localLat, numValue);
    }
  };

  const copyCoordinates = async () => {
    const coordinates = `${localLat.toFixed(6)}, ${localLng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Coordenadas Copiadas',
        description: `${coordinates} copiado para área de transferência`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao Copiar',
        description: 'Não foi possível copiar as coordenadas',
        variant: 'destructive',
      });
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${localLat},${localLng}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-destructive">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center gap-2 flex-1"
          >
            <Navigation className="h-4 w-4" />
            Usar Localização Atual
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={localLat || ''}
              onChange={(e) => handleLatitudeChange(e.target.value)}
              placeholder="Ex: -23.550520"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={localLng || ''}
              onChange={(e) => handleLongitudeChange(e.target.value)}
              placeholder="Ex: -46.633308"
              className="text-xs"
            />
          </div>
        </div>

        {(localLat !== 0 || localLng !== 0) && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCoordinates}
              className="flex items-center gap-1 flex-1"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInMaps}
              className="flex items-center gap-1 flex-1"
            >
              <MapPin className="h-3 w-3" />
              Ver no Mapa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}