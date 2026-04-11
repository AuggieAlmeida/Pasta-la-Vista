import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { IProduct, ICustomization } from '../types/menu';
import { useCartStore } from '../stores/cart.store';

interface CustomizationModalProps {
  visible: boolean;
  product: IProduct | null;
  onClose: () => void;
}

const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ICustomization | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<ICustomization[]>([]);

  const sizeCustomizations = useMemo(
    () => product?.customizations?.filter((c) => c.type === 'size') || [],
    [product]
  );

  const ingredientCustomizations = useMemo(
    () => product?.customizations?.filter((c) => c.type === 'ingredient') || [],
    [product]
  );

  const calculatedPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    if (selectedSize) {
      price += selectedSize.price_modifier;
    }
    for (const ing of selectedIngredients) {
      price += ing.price_modifier;
    }
    return price * quantity;
  }, [product, selectedSize, selectedIngredients, quantity]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    if (selectedSize) {
      price += selectedSize.price_modifier;
    }
    for (const ing of selectedIngredients) {
      price += ing.price_modifier;
    }
    return price;
  }, [product, selectedSize, selectedIngredients]);

  const handleToggleIngredient = useCallback((ingredient: ICustomization) => {
    setSelectedIngredients((prev) => {
      const exists = prev.find((i) => i._id === ingredient._id);
      if (exists) {
        return prev.filter((i) => i._id !== ingredient._id);
      }
      return [...prev, ingredient];
    });
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const customizations = [];
    if (selectedSize) {
      customizations.push({
        id: selectedSize._id,
        name: selectedSize.name,
        price_modifier: selectedSize.price_modifier,
      });
    }
    for (const ing of selectedIngredients) {
      customizations.push({
        id: ing._id,
        name: ing.name,
        price_modifier: ing.price_modifier,
      });
    }

    addItem({
      id: product._id,
      name: product.name,
      unit_price: unitPrice,
      quantity,
      customizations,
      subtotal: calculatedPrice,
    });

    // Reset state
    setQuantity(1);
    setSelectedSize(null);
    setSelectedIngredients([]);
    onClose();
  }, [product, selectedSize, selectedIngredients, quantity, unitPrice, calculatedPrice, addItem, onClose]);

  const handleClose = useCallback(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSelectedIngredients([]);
    onClose();
  }, [onClose]);

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.container}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.basePrice}>
              A partir de {formatPrice(product.price)}
            </Text>

            {/* Tamanho (Radio) */}
            {sizeCustomizations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tamanho</Text>
                {sizeCustomizations.map((size) => (
                  <TouchableOpacity
                    key={size._id}
                    style={[
                      styles.optionRow,
                      selectedSize?._id === size._id && styles.optionSelected,
                    ]}
                    onPress={() => setSelectedSize(size)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radio}>
                      {selectedSize?._id === size._id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.optionName}>{size.name}</Text>
                    {size.price_modifier > 0 && (
                      <Text style={styles.optionPrice}>
                        +{formatPrice(size.price_modifier)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Ingredientes (Checkbox) */}
            {ingredientCustomizations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredientes extras</Text>
                {ingredientCustomizations.map((ingredient) => {
                  const isSelected = selectedIngredients.some(
                    (i) => i._id === ingredient._id
                  );
                  return (
                    <TouchableOpacity
                      key={ingredient._id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => handleToggleIngredient(ingredient)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkbox}>
                        {isSelected && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={styles.optionName}>{ingredient.name}</Text>
                      {ingredient.price_modifier > 0 && (
                        <Text style={styles.optionPrice}>
                          +{formatPrice(ingredient.price_modifier)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Quantidade */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantidade</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Text
                    style={[
                      styles.quantityButtonText,
                      quantity <= 1 && styles.quantityDisabled,
                    ]}
                  >
                    -
                  </Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer com preco e botao */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>
                {formatPrice(calculatedPrice)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>Adicionar ao Carrinho</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  basePrice: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FF6B35',
  },
  optionName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  optionPrice: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
  },
  quantityDisabled: {
    color: '#CCC',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
