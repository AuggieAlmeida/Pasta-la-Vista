import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types/menu';

export interface CartState {
  items: CartItem[];
  notes: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zip: string;
  } | null;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  setAddress: (address: CartState['address']) => void;

  // Getters
  getTotal: () => number;
  getItemCount: () => number;
}

const calculateSubtotal = (item: CartItem): number => {
  const customizationTotal = item.customizations.reduce(
    (sum, c) => sum + c.price_modifier,
    0
  );
  return (item.unit_price + customizationTotal) * item.quantity;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: '',
      address: null,

      addItem: (newItem: CartItem) => {
        set((state) => {
          // Verificar se item ja existe (merge)
          const existingIndex = state.items.findIndex(
            (item) =>
              item.id === newItem.id &&
              JSON.stringify(item.customizations) ===
                JSON.stringify(newItem.customizations)
          );

          if (existingIndex >= 0) {
            // Merge: incrementar quantidade
            const updatedItems = [...state.items];
            const existing = updatedItems[existingIndex];
            const newQty = existing.quantity + newItem.quantity;
            updatedItems[existingIndex] = {
              ...existing,
              quantity: newQty,
              subtotal: calculateSubtotal({ ...existing, quantity: newQty }),
            };
            return { items: updatedItems };
          }

          // Novo item
          const itemWithSubtotal: CartItem = {
            ...newItem,
            subtotal: calculateSubtotal(newItem),
          };

          return { items: [...state.items, itemWithSubtotal] };
        });
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id: string, qty: number) => {
        if (qty < 1) return;

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: qty,
                  subtotal: calculateSubtotal({ ...item, quantity: qty }),
                }
              : item
          ),
        }));
      },

      clear: () => {
        set({ items: [], notes: '', address: null });
      },

      setNotes: (notes: string) => {
        set({ notes });
      },

      setAddress: (address) => {
        set({ address });
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        notes: state.notes,
        address: state.address,
      }),
    }
  )
);
