import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, DashboardMetrics, AdminOrder, StockItem } from '../api/endpoints/admin.api';

// ──── Dashboard ────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery<DashboardMetrics>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboardMetrics(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
  });
}

// ──── Orders ──────────────────────────────────────────

export function useAdminOrders() {
  return useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminApi.listAllOrders(),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// ──── Stock ───────────────────────────────────────────

export function useAdminStock() {
  return useQuery<StockItem[]>({
    queryKey: ['admin', 'stock'],
    queryFn: () => adminApi.getAllStock(),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useStockAlerts() {
  return useQuery<StockItem[]>({
    queryKey: ['admin', 'stock', 'alerts'],
    queryFn: () => adminApi.getStockAlerts(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stockId,
      data,
    }: {
      stockId: string;
      data: { quantity: number; minQuantity?: number };
    }) => adminApi.updateStock(stockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

// ──── Products (Admin CRUD) ───────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createProduct>[0]) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.updateProduct>[1] }) =>
      adminApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, imageUri }: { productId: string; imageUri: string }) =>
      adminApi.uploadProductImage(productId, imageUri),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

