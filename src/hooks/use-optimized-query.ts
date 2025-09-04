import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Hook otimizado para queries com cache inteligente
export const useOptimizedQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutos fresh
    gcTime: 10 * 60 * 1000, // 10 minutos no cache
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    retry: 2,
    ...options,
  });
};

// Hook para dados que mudam raramente (produtos, afiliações)
export const useStaticQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30 * 60 * 1000, // 30 minutos fresh
    gcTime: 60 * 60 * 1000, // 1 hora no cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Só refaz se não tiver dados
    refetchOnReconnect: true,
    retry: 2,
    ...options,
  });
};

// Hook para dados que mudam frequentemente (vendas, pagamentos)
export const useDynamicQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutos fresh
    gcTime: 5 * 60 * 1000, // 5 minutos no cache
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    retry: 2,
    ...options,
  });
};

// Função para prefetch de dados relacionados
export const prefetchRelatedData = async (userId: string) => {
  // Pré-carrega dados importantes quando usuário faz login
  const queries = [
    {
      queryKey: ['dashboard-stats', userId],
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ['customer-accounts', userId],
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ['clients', userId],
      staleTime: 30 * 60 * 1000,
    },
    {
      queryKey: ['products', userId],
      staleTime: 30 * 60 * 1000,
    },
    {
      queryKey: ['affiliations', userId],
      staleTime: 30 * 60 * 1000,
    },
  ];

  queries.forEach(({ queryKey, staleTime }) => {
    queryClient.prefetchQuery({
      queryKey,
      staleTime,
    });
  });
};

// Hook para invalidar queries relacionadas após mutations
export const useInvalidateRelated = () => {
  const invalidateCustomerData = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const invalidateSalesData = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['customer-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const invalidatePaymentData = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['customer-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const invalidateProductData = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return {
    invalidateCustomerData,
    invalidateSalesData,
    invalidatePaymentData,
    invalidateProductData,
  };
};