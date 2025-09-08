import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GpsStatus } from '@/components/ui/gps-status';
import { LocationPicker } from '@/components/ui/location-picker';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

export const GpsDemo = () => {
  const [demoLatitude, setDemoLatitude] = useState<number>(-23.550520);
  const [demolongitude, setDemoLongitude] = useState<number>(-46.633308);

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <MapPin className="h-6 w-6" />
          GPS & Geolocalização
        </h1>
        <p className="text-muted-foreground mt-2">
          Demonstração dos recursos de GPS disponíveis no app
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status do GPS</CardTitle>
        </CardHeader>
        <CardContent>
          <GpsStatus
            onLocationUpdate={(lat, lng) => {
              console.log('Location updated:', { lat, lng });
            }}
            showCoordinates={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seletor de Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationPicker
            latitude={demoLatitude}
            longitude={demolongitude}
            onLocationChange={(lat, lng) => {
              setDemoLatitude(lat);
              setDemoLongitude(lng);
            }}
            label="Localização Personalizada"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Compacto</CardTitle>
        </CardHeader>
        <CardContent>
          <GpsStatus
            compact={true}
            showCoordinates={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instruções para Mobile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Para usar no dispositivo móvel:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Exporte o projeto para o GitHub</li>
              <li>Clone o projeto localmente</li>
              <li>Execute: <code className="bg-muted px-1 rounded">npm install</code></li>
              <li>Execute: <code className="bg-muted px-1 rounded">npx cap add android</code> ou <code className="bg-muted px-1 rounded">npx cap add ios</code></li>
              <li>Execute: <code className="bg-muted px-1 rounded">npm run build</code></li>
              <li>Execute: <code className="bg-muted px-1 rounded">npx cap sync</code></li>
              <li>Execute: <code className="bg-muted px-1 rounded">npx cap run android</code> ou <code className="bg-muted px-1 rounded">npx cap run ios</code></li>
            </ol>
          </div>
          
          <Button asChild className="w-full">
            <a 
              href="https://lovable.dev/blogs/TODO" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Leia o Blog Post Completo
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};