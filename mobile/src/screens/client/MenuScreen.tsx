import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useMenu, useMenuByCategory, useSearchMenu } from '../../hooks/useMenu';
import { MenuProductCard } from '../../components/MenuProductCard';
import { CustomizationModal } from '../../components/CustomizationModal';
import { IProduct } from '../../types/menu';

const CATEGORIES = ['Todos', 'Pizzas', 'Bebidas', 'Sobremesas', 'Massas'];
const CATEGORY_MAP: Record<string, string> = {
  Pizzas: 'pizzas',
  Bebidas: 'bebidas',
  Sobremesas: 'sobremesas',
  Massas: 'massas',
};

export const MenuScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const menuQuery = useMenu();
  const categoryQuery = useMenuByCategory(
    CATEGORY_MAP[selectedCategory] || ''
  );
  const searchResults = useSearchMenu(debouncedQuery);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        setDebouncedQuery(text.trim());
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  const handleAddProduct = useCallback((product: IProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const products = useMemo(() => {
    if (debouncedQuery.length > 2 && searchResults.data) {
      return searchResults.data;
    }
    if (selectedCategory !== 'Todos' && categoryQuery.data) {
      return categoryQuery.data;
    }
    return menuQuery.data || [];
  }, [
    debouncedQuery,
    searchResults.data,
    selectedCategory,
    categoryQuery.data,
    menuQuery.data,
  ]);

  const isLoading =
    menuQuery.isLoading ||
    (selectedCategory !== 'Todos' && categoryQuery.isLoading) ||
    (debouncedQuery.length > 2 && searchResults.isLoading);

  const isError =
    menuQuery.isError ||
    (selectedCategory !== 'Todos' && categoryQuery.isError) ||
    (debouncedQuery.length > 2 && searchResults.isError);

  const handleRefresh = useCallback(() => {
    if (selectedCategory === 'Todos') {
      menuQuery.refetch();
    } else {
      categoryQuery.refetch();
    }
  }, [selectedCategory, menuQuery, categoryQuery]);

  const renderProduct = useCallback(
    ({ item }: { item: IProduct }) => (
      <MenuProductCard product={item} onAdd={handleAddProduct} />
    ),
    [handleAddProduct]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Pasta la Vista</Text>
        <Text style={styles.subtitle}>O melhor da cozinha italiana</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryPill,
              selectedCategory === category && styles.categoryPillActive,
            ]}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando cardapio...</Text>
        </View>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Erro ao carregar cardapio
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product List */}
      {!isLoading && !isError && (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={menuQuery.isRefetching}
              onRefresh={handleRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                Nenhum produto encontrado
              </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 50,
    minHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
