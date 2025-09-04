import { QueryClient } from '@tanstack/react-query';

// Criar o QueryClient com configurações otimizadas
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam frescos por esse tempo
      gcTime: 10 * 60 * 1000, // 10 minutos - dados ficam no cache por esse tempo (novo nome para cacheTime)
      refetchOnWindowFocus: false, // Não refaz query ao focar na janela
      refetchOnMount: 'always', // Sempre refaz query ao montar componente
      refetchOnReconnect: true, // Refaz query ao reconectar
      retry: 2, // Tenta 2 vezes em caso de erro
      networkMode: 'online', // Só executa queries quando online
    },
    mutations: {
      retry: 1, // Tenta 1 vez em caso de erro nas mutations
      networkMode: 'online',
    },
  },
});

// Configurar persistência simples no localStorage
const CACHE_KEY = 'dcris-app-cache';
const CACHE_VERSION = '1.0.0';

// Salvar cache no localStorage
const saveToStorage = (data: any) => {
  try {
    const cacheData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save cache to localStorage:', error);
  }
};

// Carregar cache do localStorage
const loadFromStorage = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000; // 24 horas
    
    if (isExpired || cacheData.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Failed to load cache from localStorage:', error);
    return null;
  }
};

// Auto-save cache periodicamente
let saveTimeout: NodeJS.Timeout;
const scheduleCacheSave = () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const cacheData = queries.reduce((acc, query) => {
      if (query.state.data && query.queryKey) {
        acc[JSON.stringify(query.queryKey)] = {
          data: query.state.data,
          timestamp: query.state.dataUpdatedAt,
        };
      }
      return acc;
    }, {} as Record<string, any>);
    
    saveToStorage(cacheData);
  }, 2000); // Salva após 2 segundos de inatividade
};

// Listener para mudanças no cache
queryClient.getQueryCache().subscribe(() => {
  scheduleCacheSave();
});

// Restaurar cache ao inicializar
const restoreCache = () => {
  const cachedData = loadFromStorage();
  if (!cachedData) return;
  
  Object.entries(cachedData).forEach(([queryKey, value]: [string, any]) => {
    try {
      const parsedKey = JSON.parse(queryKey);
      const isStale = Date.now() - value.timestamp > 5 * 60 * 1000; // 5 minutos
      
      queryClient.setQueryData(parsedKey, value.data);
      
      // Se os dados estão stale, marca para refetch
      if (isStale) {
        queryClient.invalidateQueries({ queryKey: parsedKey });
      }
    } catch (error) {
      console.warn('Failed to restore query cache:', error);
    }
  });
};

// Restaurar cache na inicialização
restoreCache();

// Função para invalidar todas as queries (útil para refresh manual)
export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};

// Função para limpar cache completamente
export const clearCache = () => {
  queryClient.clear();
  localStorage.removeItem('dcris-app-cache');
};

// Função para pré-carregar dados importantes
export const prefetchImportantData = async (userId: string) => {
  const importantQueries = [
    'dashboard-stats',
    'customer-accounts',
    'clients',
    'products',
    'affiliations',
  ];

  // Pré-carrega queries importantes em background
  importantQueries.forEach((queryKey) => {
    queryClient.prefetchQuery({
      queryKey: [queryKey],
      staleTime: 2 * 60 * 1000, // 2 minutos para pré-fetch
    });
  });
};