import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { toast } from '@/components/ui/use-toast';

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

      toast({
        title: 'Localização Obtida',
        description: 'Sua localização foi atualizada com sucesso',
      });

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao obter localização';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      toast({
        title: 'Erro de Localização',
        description: errorMessage,
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
    getCurrentPosition,
    watchPosition,
    checkPermissions,
    requestPermissions,
  };
};