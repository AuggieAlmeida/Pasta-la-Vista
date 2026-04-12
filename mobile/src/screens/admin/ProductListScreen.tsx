import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../api/endpoints/menu.api';
import { useDeleteProduct } from '../../hooks/useAdmin';
import { IProduct } from '../../types/menu';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const deleteMutation = useDeleteProduct();

  const { data: products, isLoading, isRefetching, refetch } = useQuery<IProduct[]>({
    queryKey: ['products'],
    queryFn: () => menuApi.fetchMenu(),
  });

  const handleEdit = (product: IProduct) => {
    navigation.navigate('ProductForm', { productId: product._id, product });
  };

  const handleCreate = () => {
    navigation.navigate('ProductForm');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir "${name}"? Esta ação removerá o produto do cardápio e o histórico de estoque associado (se houver).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id) 
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>


      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {products?.map((product) => (
          <View key={product._id} style={styles.card}>
            <Image 
              source={{ uri: product.image || 'https://via.placeholder.com/150' }} 
              style={styles.image} 
              resizeMode="cover"
            />
            
            <View style={styles.details}>
              <View style={styles.titleRow}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                {!product.active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inativo</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.productCategory}>{product.category}</Text>
              <Text style={styles.productPrice}>
                R$ {product.price.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleEdit(product)}
              >
                <Feather name="edit-2" size={16} color={COLORS.info} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(product._id, product.name)}
              >
                <Feather name="trash-2" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {products?.length === 0 && (
          <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
