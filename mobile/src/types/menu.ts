import { z } from 'zod';

export interface ICustomization {
  _id: string;
  type: 'size' | 'ingredient' | 'variation';
  name: string;
  price_modifier: number;
  available: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  active: boolean;
  preparation_time: number;
  customizations: ICustomization[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  customizations: {
    id: string;
    name: string;
    price_modifier: number;
  }[];
  subtotal: number;
}

export interface IOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  customizations: {
    customization_id: string;
    name: string;
    price_modifier: number;
  }[];
  subtotal: number;
}

export interface IOrder {
  id: string;
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  /** Pode vir ausente em respostas antigas do log; preferir inferir por endereço/mesa. */
  delivery_mode?: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  table_number?: string;
  coupon_code?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  payment_method: 'PIX' | 'CREDIT_CARD' | 'CASH';
  review?: {
    rating: number;
    comment: string;
    created_at: string;
  };
  createdAt: string;
}

export const AddressSchema = z.object({
  street: z.string().min(3, 'Rua e obrigatoria'),
  number: z.string().min(1, 'Numero e obrigatorio'),
  complement: z.string().max(200).optional(),
  city: z.string().min(2, 'Cidade e obrigatoria'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP invalido'),
});

export const CheckoutSchema = z.object({
  delivery_mode: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']).default('DELIVERY'),
  table_number: z.string().optional(),
  coupon_code: z.string().optional(),
  address_id: z.string().optional(),
  notes: z.string().max(1000).optional().default(''),
  payment_method: z.enum(['PIX', 'CREDIT_CARD', 'CASH'], {
    errorMap: () => ({ message: 'Metodo de pagamento invalido' }),
  }),
}).refine(data => {
  if (data.delivery_mode === 'DELIVERY' && !data.address_id) {
    return false;
  }
  return true;
}, { message: 'Endereço é obrigatório para entrega', path: ['address_id'] })
.refine(data => {
  if (data.delivery_mode === 'DINE_IN' && !data.table_number) {
    return false;
  }
  return true;
}, { message: 'Mesa é obrigatória', path: ['table_number'] });

export type AddressInput = z.infer<typeof AddressSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
