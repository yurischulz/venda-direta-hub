import { MapPin, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';

interface GpsStatusProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  showCoordinates?: boolean;
  compact?: boolean;
}

export function GpsStatus({ 
  onLocationUpdate, 
  showCoordinates = true, 
  compact = false 
}: GpsStatusProps) {
  const { position, loading, error, permission, getCurrentPosition } = useGeolocation();

  const handleGetLocation = async () => {
    const newPosition = await getCurrentPosition();
    if (newPosition && onLocationUpdate) {
      onLocationUpdate(
        newPosition.coords.latitude,
        newPosition.coords.longitude
      );
    }
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (position) return 'default';
    if (permission?.location === 'denied') return 'destructive';
    return 'secondary';
  };

  const getStatusText = () => {
    if (loading) return 'Obtendo localização...';
    if (error) return 'Erro na localização';
    if (position) return 'Localização obtida';
    if (permission?.location === 'denied') return 'Permissão negada';
    return 'Aguardando localização';
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error || permission?.location === 'denied') return <AlertTriangle className="h-4 w-4" />;
    if (position) return <CheckCircle className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          Status GPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetLocation}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MapPin className="h-3 w-3" />
            )}
            Atualizar
          </Button>
        </div>
        
        {showCoordinates && position && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Lat: {position.coords.latitude.toFixed(6)}</div>
            <div>Lng: {position.coords.longitude.toFixed(6)}</div>
            <div>Precisão: {position.coords.accuracy?.toFixed(0)}m</div>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-destructive">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}