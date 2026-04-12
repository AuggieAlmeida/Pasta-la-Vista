import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useMenu } from '../../hooks/useMenu';
import { favoritesApi } from '../../api/endpoints/favorites.api';
import { MenuProductCard } from '../../components/MenuProductCard';
import { CustomizationModal } from '../../components/CustomizationModal';
import { IProduct } from '../../types/menu';

export const FavoritesScreen: React.FC = () => {
  const { data: allProducts, isLoading: loadingMenu } = useMenu();
  const { data: favoriteIds, isLoading: loadingFavorites, refetch: refetchFavorites } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: favoritesApi.getFavorites,
  });

  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddProduct = useCallback((product: IProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const isLoading = loadingMenu || loadingFavorites;

  const favoriteProducts = React.useMemo(() => {
    if (!allProducts || !favoriteIds) return [];
    return allProducts.filter(p => favoriteIds.includes(p._id));
  }, [allProducts, favoriteIds]);

  const renderProduct = useCallback(({ item }: { item: IProduct }) => (
    <MenuProductCard product={item} onAdd={handleAddProduct} />
  ), [handleAddProduct]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Favoritos</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={favoriteProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetchFavorites}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Você ainda não possui itens favoritos.</Text>
            </View>
          }
        />
      )}

      {/* Customization Modal */}
      <CustomizationModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={handleCloseModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { backgroundColor: '#FF6B35', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 10 },
  listContent: { paddingTop: 12, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
});
