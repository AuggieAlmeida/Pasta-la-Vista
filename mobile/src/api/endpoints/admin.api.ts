import api from '../axios';
import { IOrder, IProduct } from '../../types/menu';

/** Payload de criação/atualização de produto (customizações sem _id até o MongoDB persistir). */
export type AdminProductWritePayload = Omit<
  Partial<IProduct>,
  'customizations' | '_id' | 'createdAt' | 'updatedAt'
> & {
  customizations?: Array<{
    type: 'size' | 'ingredient' | 'variation';
    name: string;
    price_modifier: number;
    available: boolean;
  }>;
};

interface ApiResponse<T> {
  status: string;
  data: T;
  count?: number;
}

/** MIME válido para o Multer (evita image/jpg, que é rejeitado). */
function resolveUploadMimeType(fileName: string, fromPicker?: string | null): string {
  const m = fromPicker?.trim().toLowerCase();
  if (m && /^image\/(jpeg|jpg|png|webp|gif|heic|heif)$/i.test(m)) {
    return m === 'image/jpg' ? 'image/jpeg' : m;
  }
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext] || 'image/jpeg';
}

// ─── Types ──────────────────────────────────────────────

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  productImage: string;
  quantity: number;
  minQuantity: number;
  status: 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK';
}

export interface DashboardMetrics {
  orders: {
    total: number;
    today: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    total: number;
    today: number;
    averageTicket: number;
  };
  stock: {
    totalProducts: number;
    alerts: number;
  };
}

export interface AdminOrder extends IOrder {
  userName: string;
  userEmail: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

// ─── API Calls ──────────────────────────────────────────

export const adminApi = {
  // ──── Dashboard ──────────────────────────────
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<ApiResponse<DashboardMetrics>>(
      '/api/v1/admin/dashboard/metricas'
    );
    return response.data.data;
  },

  /**
   * Retorna os feedbacks e avaliações dos pedidos
   */
  async getFeedbacks(): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>('/api/v1/admin/feedbacks');
    return response.data.data;
  },

  // ──── Orders ────────────────────────────────
  async listAllOrders(): Promise<AdminOrder[]> {
    const response = await api.get<ApiResponse<AdminOrder[]>>(
      '/api/v1/admin/pedidos'
    );
    return response.data.data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<IOrder> {
    const response = await api.patch<ApiResponse<IOrder>>(
      `/api/v1/admin/pedidos/${orderId}`,
      { status }
    );
    return response.data.data;
  },

  // ──── Stock ─────────────────────────────────
  async getAllStock(): Promise<StockItem[]> {
    const response = await api.get<ApiResponse<StockItem[]>>(
      '/api/v1/admin/estoque'
    );
    return response.data.data;
  },

  async getStockAlerts(): Promise<StockItem[]> {
    const response = await api.get<ApiResponse<StockItem[]>>(
      '/api/v1/admin/estoque/alertas'
    );
    return response.data.data;
  },

  async updateStock(
    stockId: string,
    data: { quantity: number; minQuantity?: number }
  ): Promise<StockItem> {
    const response = await api.patch<ApiResponse<StockItem>>(
      `/api/v1/admin/estoque/${stockId}`,
      data
    );
    return response.data.data;
  },

  // ──── Products (Menu) ───────────────────────
  async createProduct(data: AdminProductWritePayload): Promise<IProduct> {
    const response = await api.post<ApiResponse<IProduct>>(
      '/api/v1/menu',
      data
    );
    return response.data.data;
  },

  async updateProduct(id: string, data: AdminProductWritePayload): Promise<IProduct> {
    const response = await api.patch<ApiResponse<IProduct>>(
      `/api/v1/menu/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/v1/menu/${id}`);
  },

  async listCoupons(): Promise<AdminCoupon[]> {
    const response = await api.get<ApiResponse<AdminCoupon[]>>('/api/v1/admin/cupons');
    return response.data.data;
  },

  async createCoupon(payload: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    usageLimit?: number | null;
  }): Promise<AdminCoupon> {
    const response = await api.post<ApiResponse<AdminCoupon>>('/api/v1/admin/cupons', payload);
    return response.data.data;
  },

  async setCouponActive(id: string, active: boolean): Promise<AdminCoupon> {
    const response = await api.patch<ApiResponse<AdminCoupon>>(`/api/v1/admin/cupons/${id}`, {
      active,
    });
    return response.data.data;
  },

  // ──── Product Image Upload ──────────────────
  async uploadProductImage(
    productId: string,
    imageUri: string,
    meta?: { mimeType?: string | null; fileName?: string | null }
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();

    const rawName =
      meta?.fileName?.trim() ||
      imageUri.split('/').pop()?.split('?')[0] ||
      'upload.jpg';
    const fileName = rawName.includes('.') ? rawName : `${rawName}.jpg`;
    const type = resolveUploadMimeType(fileName, meta?.mimeType);

    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type,
    } as any);

    const response = await api.post<ApiResponse<{ imageUrl: string; productId: string }>>(
      `/api/v1/admin/produtos/${productId}/imagem`,
      formData,
      {
        timeout: 120_000,
        transformRequest: (data, headers) => {
          const h = headers as Record<string, string | undefined>;
          const isForm =
            typeof FormData !== 'undefined' &&
            (data instanceof FormData ||
              (data != null && typeof (data as FormData).append === 'function'));
          if (isForm) {
            delete h['Content-Type'];
          }
          return data;
        },
      }
    );
    return response.data.data;
  },
};
