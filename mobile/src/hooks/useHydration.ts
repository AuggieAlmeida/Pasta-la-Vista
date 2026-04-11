import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store';

/**
 * Hook que aguarda a hidratação completa dos stores persistentes
 * Resolve o problema de "runtime not ready" em iOS
 */
export const useHydration = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Aguardar ambos os stores serem hidratados
    const authUnsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });

    return () => {
      authUnsubscribe?.();
    };
  }, []);

  return isHydrated;
};

/**
 * Hook mais simples: apenas aguarda um pequeno atraso
 * para garantir que AsyncStorage está pronto
 */
export const useAsyncStorageReady = (): boolean => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir inicialização
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isReady;
};
