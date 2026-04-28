import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../api/endpoints/menu.api';
import type { IProduct } from '../types/menu';

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: menuApi.fetchMenu,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => menuApi.fetchProductById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useMenuByCategory(category: string) {
  return useQuery({
    queryKey: ['menu', 'category', category],
    queryFn: () => menuApi.fetchByCategory(category),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!category && category !== 'Todos',
  });
}

export function useSearchMenu(query: string) {
  return useQuery({
    queryKey: ['menu', 'search', query],
    queryFn: () => menuApi.searchProducts(query),
    enabled: query.trim().length > 2,
    staleTime: 1000 * 30,
    gcTime: 5 * 60 * 1000,
    placeholderData: [] as IProduct[],
  });
}
