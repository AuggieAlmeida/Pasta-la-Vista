import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { IProduct } from '../types/menu';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../api/endpoints/favorites.api';
import Toast from 'react-native-toast-message';

interface MenuProductCardProps {
  product: IProduct;
  onAdd: (product: IProduct) => void;
}

const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

export const MenuProductCard: React.FC<MenuProductCardProps> = ({
  product,
  onAdd,
}) => {
  const queryClient = useQueryClient();
  const { data: favorites = [] } = useQuery({ queryKey: ['user-favorites'], queryFn: favoritesApi.getFavorites });
  const isFavorite = favorites.includes(product._id);

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(product._id);
      } else {
        await favoritesApi.addFavorite(product._id);
      }
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    } catch {
      Toast.show({ type: 'error', text1: 'Falha ao favoritar' });
    }
  };

  return (
    <View style={styles.cardOuter}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>
                {product.category === 'pizzas'
                  ? 'Pizza'
                  : product.category === 'bebidas'
                    ? 'Bebida'
                    : product.category === 'sobremesas'
                      ? 'Sobremesa'
                      : product.category === 'massas'
                        ? 'Massa'
                        : product.category === 'saladas'
                          ? 'Salada'
                          : product.category === 'entradas'
                            ? 'Entradas'
                            : 'Prato'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteBtn}>
              <FontAwesome5 name="heart" solid={isFavorite} size={18} color={isFavorite ? '#FF4444' : '#CCC'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAdd(product)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.bottomOrangeAccent} />
    </View>
  );
};

const ORANGE = '#FF6B35';

const styles = StyleSheet.create({
  cardOuter: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: 110,
    minHeight: 110,
    alignSelf: 'stretch',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOrangeAccent: {
    height: 4,
    width: '100%',
    backgroundColor: ORANGE,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteBtn: {
    padding: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
