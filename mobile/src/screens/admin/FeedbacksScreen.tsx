import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { adminApi } from '../../api/endpoints/admin.api';

export const FeedbacksScreen: React.FC = () => {
  const {
    data: feedbacks,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: adminApi.getFeedbacks,
    staleTime: 1 * 60 * 1000,
  });

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFeedback = useCallback(
    ({ item }: { item: any }) => {
      // item = { orderId, userName, userEmail, rating, comment, createdAt }
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.orderId}>Pedido #{item.orderId?.slice(0, 8)}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <FontAwesome5 name="star" solid size={14} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          {!!item.comment && (
            <View style={styles.commentContainer}>
              <Feather name="message-square" size={16} color="#9CA3AF" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.commentText}>{item.comment}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.userEmail}>{item.userEmail}</Text>
          </View>
        </View>
      );
    },
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando avaliações...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar avaliações</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedbacks}
        renderItem={renderFeedback}
        keyExtractor={(item, index) => item.orderId || String(index)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Feather name="inbox" size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Nenhuma avaliação recebida</Text>
            <Text style={styles.emptySubtitle}>Os feedbacks dos clientes aparecerão aqui</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    fontWeight: '500',
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  commentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  userEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
