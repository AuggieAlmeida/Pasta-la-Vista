import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import { adminApi, AdminCoupon } from '../../api/endpoints/admin.api';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
};

const formatPrice = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

export const CouponsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const { data: coupons, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.listCoupons(),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCode('');
      setDiscountValue('');
      setUsageLimit('');
      Toast.show({ type: 'success', text1: 'Cupom criado' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível criar',
        text2: err?.response?.data?.message || 'Erro',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.setCouponActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Falha ao atualizar',
        text2: err?.response?.data?.message || 'Erro',
      });
    },
  });

  const handleCreate = useCallback(() => {
    const rawVal = parseFloat(discountValue.replace(',', '.'));
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o código do cupom' });
      return;
    }
    if (!Number.isFinite(rawVal) || rawVal <= 0) {
      Toast.show({ type: 'error', text1: 'Valor de desconto inválido' });
      return;
    }
    if (discountType === 'PERCENTAGE' && rawVal > 100) {
      Toast.show({ type: 'error', text1: 'Porcentagem máxima é 100%' });
      return;
    }
    const limitRaw = usageLimit.trim();
    let usageLimitNum: number | null | undefined;
    if (limitRaw.length > 0) {
      const n = parseInt(limitRaw, 10);
      if (!Number.isFinite(n) || n < 1) {
        Toast.show({ type: 'error', text1: 'Limite de usos inválido' });
        return;
      }
      usageLimitNum = n;
    }
    createMutation.mutate({
      code: code.trim(),
      discountType,
      discountValue: rawVal,
      usageLimit: usageLimitNum,
    });
  }, [code, discountType, discountValue, usageLimit, createMutation]);

  const renderCoupon = (c: AdminCoupon) => (
    <View key={c.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.code}>{c.code}</Text>
        <View style={[styles.badge, c.active ? styles.badgeOn : styles.badgeOff]}>
          <Text style={styles.badgeText}>{c.active ? 'Ativo' : 'Inativo'}</Text>
        </View>
      </View>
      <Text style={styles.discountLine}>
        {c.discountType === 'PERCENTAGE'
          ? `${c.discountValue}% de desconto`
          : `${formatPrice(c.discountValue)} fixo`}
      </Text>
      <Text style={styles.meta}>
        Usos: {c.usedCount}
        {c.usageLimit != null ? ` / ${c.usageLimit}` : ' (sem limite)'}
      </Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Cupom ativo</Text>
        <Switch
          value={c.active}
          onValueChange={(v) => toggleMutation.mutate({ id: c.id, active: v })}
          disabled={toggleMutation.isPending}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor="#FFF"
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.sectionTitle}>Novo cupom</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>Código</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Ex: PASTA10"
          autoCapitalize="characters"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={styles.label}>Tipo de desconto</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeChip, discountType === 'PERCENTAGE' && styles.typeChipActive]}
            onPress={() => setDiscountType('PERCENTAGE')}
          >
            <Text style={[styles.typeChipText, discountType === 'PERCENTAGE' && styles.typeChipTextActive]}>
              Porcentagem
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeChip, discountType === 'FIXED' && styles.typeChipActive]}
            onPress={() => setDiscountType('FIXED')}
          >
            <Text style={[styles.typeChipText, discountType === 'FIXED' && styles.typeChipTextActive]}>
              Valor fixo
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>{discountType === 'PERCENTAGE' ? 'Porcentagem (%)' : 'Valor (R$)'}</Text>
        <TextInput
          style={styles.input}
          value={discountValue}
          onChangeText={setDiscountValue}
          placeholder={discountType === 'PERCENTAGE' ? '10' : '15,90'}
          keyboardType="decimal-pad"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={styles.label}>Limite de usos (opcional)</Text>
        <TextInput
          style={styles.input}
          value={usageLimit}
          onChangeText={setUsageLimit}
          placeholder="Vazio = ilimitado"
          keyboardType="number-pad"
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity
          style={[styles.createBtn, createMutation.isPending && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="plus-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.createBtnText}>Criar cupom</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Cupons cadastrados</Text>
      {coupons && coupons.length > 0 ? (
        coupons.map(renderCoupon)
      ) : (
        <Text style={styles.empty}>Nenhum cupom ainda.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: '#FFF5F0', borderColor: COLORS.primary },
  typeChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  typeChipTextActive: { color: COLORS.primary },
  createBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.7 },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOn: { backgroundColor: '#D1FAE5' },
  badgeOff: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.text },
  discountLine: { fontSize: 15, color: COLORS.textMuted, marginTop: 8 },
  meta: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  empty: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 },
});
