import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { toast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';

interface LocationState {
  position: Position | null;
  loading: boolean;
  error: string | null;
  permission: PermissionStatus | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<LocationState>({
    position: null,
    loading: false,
    error: null,
    permission: null,
  });

  const checkPermissions = useCallback(async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar permissões';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const permission = await Geolocation.requestPermissions();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar permissões';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Erro de Permissão',
        description: 'Não foi possível obter permissão para acessar a localização',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Se não estiver em plataforma nativa, usar Web Geolocation API
      if (!Capacitor.isNativePlatform()) {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            throw new Error('Geolocalização não é suportada neste navegador');
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const capacitorPosition: Position = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  altitude: position.coords.altitude,
                  speed: position.coords.speed,
                  heading: position.coords.heading,
                },
                timestamp: position.timestamp,
              };

              setState(prev => ({ 
                ...prev, 
                position: capacitorPosition, 
                loading: false, 
                error: null 
              }));

              resolve(capacitorPosition);
            },
            (error) => {
              let errorMessage = 'Erro ao obter localização';
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Permissão de localização negada pelo usuário';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Informação de localização indisponível';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Tempo limite para obter localização';
                  break;
              }

              setState(prev => ({ 
                ...prev, 
                loading: false, 
                error: errorMessage 
              }));

              toast({
                title: 'Localização não disponível',
                description: 'Não foi possível obter sua localização. Continuando sem verificar proximidade.',
                variant: 'destructive',
              });

              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          );
        });
      }

      // Para plataformas nativas, usar Capacitor
      const permission = await checkPermissions();
      
      if (permission?.location !== 'granted') {
        const newPermission = await requestPermissions();
        if (newPermission?.location !== 'granted') {
          throw new Error('Permissão de localização negada');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      setState(prev => ({ 
        ...prev, 
        position, 
        loading: false, 
        error: null 
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao obter localização';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      toast({
        title: 'Localização não disponível',
        description: 'Não foi possível obter sua localização. Continuando sem verificar proximidade.',
        variant: 'destructive',
      });
      
      return null;
    }
  }, [checkPermissions, requestPermissions]);

  const watchPosition = useCallback((callback: (position: Position) => void) => {
    let watchId: string | null = null;
    
    const startWatching = async () => {
      try {
        const permission = await checkPermissions();
        
        if (permission?.location !== 'granted') {
          const newPermission = await requestPermissions();
          if (newPermission?.location !== 'granted') {
            throw new Error('Permissão de localização negada');
          }
        }

        watchId = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        }, (position, err) => {
          if (err) {
            setState(prev => ({ ...prev, error: err.message }));
            return;
          }
          
          if (position) {
            setState(prev => ({ ...prev, position, error: null }));
            callback(position);
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao monitorar localização';
        setState(prev => ({ ...prev, error: errorMessage }));
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [checkPermissions, requestPermissions]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...state,
    getCurrentPosition: getCurrentPosition as () => Promise<Position | null>,
    watchPosition,
    checkPermissions,
    requestPermissions,
  };
};