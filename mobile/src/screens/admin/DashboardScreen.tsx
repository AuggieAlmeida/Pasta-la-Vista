import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAdminDashboard } from '../../hooks/useAdmin';

const formatPrice = (price: number): string =>
  `R$ ${Number(price || 0).toFixed(2).replace('.', ',')}`;

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: '#B45309', bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmado', color: '#1D4ED8', bg: '#DBEAFE' },
  PREPARING: { label: 'Preparo', color: '#6D28D9', bg: '#EDE9FE' },
  READY: { label: 'Pronto', color: '#047857', bg: '#D1FAE5' },
  DELIVERED: { label: 'Entregue', color: '#0F766E', bg: '#CCFBF1' },
  CANCELLED: { label: 'Cancelado', color: '#B91C1C', bg: '#FEE2E2' },
};

function formatUpdatedAt(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();
  const quickTileWidth = (windowWidth - 12 * 2 - 10) / 2;
  const { data: metrics, isLoading, isError, refetch, isRefetching, dataUpdatedAt, error } =
    useAdminDashboard();

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const statusRows = useMemo(() => {
    if (!metrics?.orders?.byStatus) return [];
    const entries = Object.entries(metrics.orders.byStatus) as [string, number][];
    return entries.sort(
      (a, b) => STATUS_ORDER.indexOf(a[0] as (typeof STATUS_ORDER)[number]) - STATUS_ORDER.indexOf(b[0] as (typeof STATUS_ORDER)[number])
    );
  }, [metrics]);

  const navigateTo = useCallback(
    (screen: string) => {
      navigation.navigate(screen);
    },
    [navigation]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingHint}>Carregando indicadores…</Text>
      </View>
    );
  }

  if (isError || !metrics) {
    const msg =
      (error as Error)?.message ||
      'Não foi possível carregar as métricas. Verifique a conexão e se você está autenticado como admin.';
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Feather name="alert-circle" size={40} color="#DC2626" />
          <Text style={styles.errorTitle}>Dashboard indisponível</Text>
          <Text style={styles.errorText}>{msg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={['#FF6B35']} />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Visão geral</Text>
        <Text style={styles.heroSubtitle}>
          Faturamento considera pedidos confirmados em diante. Cache no servidor: ~60s.
        </Text>
        {dataUpdatedAt ? (
          <Text style={styles.updatedAt}>Atualizado em {formatUpdatedAt(dataUpdatedAt)}</Text>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>Atalhos</Text>
      <View style={styles.quickGrid}>
        <QuickTile
          icon="clipboard"
          label="Pedidos"
          width={quickTileWidth}
          onPress={() => navigateTo('OrdersRoot')}
        />
        <QuickTile
          icon="package"
          label="Estoque"
          width={quickTileWidth}
          onPress={() => navigateTo('StockRoot')}
        />
        <QuickTile
          icon="star"
          label="Feedbacks"
          width={quickTileWidth}
          onPress={() => navigateTo('FeedbacksRoot')}
        />
        <QuickTile
          icon="grid"
          label="Produtos"
          width={quickTileWidth}
          onPress={() => navigateTo('ProductsRoot')}
        />
      </View>

      <Text style={styles.sectionTitle}>Faturamento</Text>
      <View style={styles.row}>
        <MetricCard
          icon="sun"
          iconColor="#15803D"
          iconBg="#DCFCE7"
          label="Hoje"
          value={formatPrice(metrics.revenue.today)}
        />
        <MetricCard
          icon="calendar-alt"
          iconColor="#C2410C"
          iconBg="#FFEDD5"
          label="Total (histórico)"
          value={formatPrice(metrics.revenue.total)}
        />
      </View>

      <View style={styles.ticketCard}>
        <View style={styles.ticketLeft}>
          <Feather name="trending-up" size={22} color="#FF6B35" />
          <View style={styles.ticketTextWrap}>
            <Text style={styles.ticketLabel}>Ticket médio</Text>
            <Text style={styles.ticketHint}>Total faturado ÷ todos os pedidos</Text>
          </View>
        </View>
        <Text style={styles.ticketValue}>{formatPrice(metrics.revenue.averageTicket)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Pedidos</Text>
      <View style={styles.row}>
        <MetricCard
          icon="shopping-bag"
          iconColor="#2563EB"
          iconBg="#DBEAFE"
          label="Total cadastrados"
          value={String(metrics.orders.total)}
          valueIsNumeric
        />
        <MetricCard
          icon="clock"
          iconColor="#7C3AED"
          iconBg="#EDE9FE"
          label="Hoje"
          value={String(metrics.orders.today)}
          valueIsNumeric
        />
      </View>

      <Text style={styles.sectionLabel}>Por status</Text>
      <View style={styles.statusWrap}>
        {statusRows.length === 0 ? (
          <Text style={styles.muted}>Nenhum dado de status.</Text>
        ) : (
          statusRows.map(([status, count]) => (
            <StatusChip key={status} status={status} count={count} />
          ))
        )}
      </View>

      {statusRows.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Volume por status</Text>
          <View style={styles.chartCard}>
            <StatusVolumeBars rows={statusRows} chartInnerWidth={windowWidth - 64} />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Estoque</Text>
      <View style={styles.stockCard}>
        <View style={styles.stockRow}>
          <View style={styles.stockIconWrap}>
            <FontAwesome5 name="boxes" size={18} color="#0369A1" />
          </View>
          <View style={styles.stockText}>
            <Text style={styles.stockTitle}>Itens no estoque</Text>
            <Text style={styles.stockSub}>{metrics.stock.totalProducts} produtos monitorados</Text>
          </View>
          <Text style={styles.stockNumber}>{metrics.stock.totalProducts}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stockRow}>
          <View style={[styles.stockIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#B91C1C" />
          </View>
          <View style={styles.stockText}>
            <Text style={styles.stockTitle}>Alertas (baixo / sem)</Text>
            <Text style={styles.stockSub}>Itens com status LOW ou OUT_OF_STOCK</Text>
          </View>
          <Text style={[styles.stockNumber, metrics.stock.alerts > 0 && styles.stockAlertNumber]}>
            {metrics.stock.alerts}
          </Text>
        </View>
        {metrics.stock.alerts > 0 ? (
          <TouchableOpacity
            style={styles.stockCta}
            onPress={() => navigateTo('StockRoot')}
            activeOpacity={0.85}
          >
            <Text style={styles.stockCtaText}>Abrir kanban de estoque</Text>
            <Feather name="chevron-right" size={18} color="#FF6B35" />
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

const MetricCard: React.FC<{
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  valueIsNumeric?: boolean;
}> = ({ icon, iconColor, iconBg, label, value, valueIsNumeric }) => (
  <View style={styles.card}>
    <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
      <FontAwesome5 name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={[styles.cardValue, valueIsNumeric && styles.cardValueNumeric]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const QuickTile: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  width: number;
  onPress: () => void;
}> = ({ icon, label, width, onPress }) => (
  <TouchableOpacity
    style={[styles.quickTile, { width }]}
    onPress={onPress}
    activeOpacity={0.88}
  >
    <View style={styles.quickIcon}>
      <Feather name={icon} size={22} color="#FF6B35" />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const StatusChip: React.FC<{ status: string; count: number }> = ({ status, count }) => {
  const meta = STATUS_META[status] || {
    label: status,
    color: '#4B5563',
    bg: '#F3F4F6',
  };
  return (
    <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.statusChipCount, { color: meta.color }]}>{count}</Text>
      <Text style={[styles.statusChipLabel, { color: meta.color }]} numberOfLines={1}>
        {meta.label}
      </Text>
    </View>
  );
};

const StatusVolumeBars: React.FC<{ rows: [string, number][]; chartInnerWidth: number }> = ({
  rows,
  chartInnerWidth,
}) => {
  const max = Math.max(...rows.map(([, n]) => n), 1);
  const innerW = Math.max(chartInnerWidth, 120);
  return (
    <>
      {rows.map(([status, count]) => {
        const meta = STATUS_META[status] || {
          label: status,
          color: '#64748B',
          bg: '#F3F4F6',
        };
        const fill =
          count > 0 ? Math.min(Math.max((count / max) * innerW, 10), innerW) : 0;
        return (
          <View key={status} style={styles.barRow}>
            <View style={styles.barHeader}>
              <Text style={styles.barLabel}>{meta.label}</Text>
              <Text style={[styles.barCount, { color: meta.color }]}>{count}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: fill, backgroundColor: meta.color }]} />
            </View>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F1F5F9' },
  loadingHint: { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 12 },
  errorText: { color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 14 },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  hero: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 8, lineHeight: 18 },
  updatedAt: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 10, fontWeight: '600' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
    justifyContent: 'space-between',
  },
  quickTile: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'center' },
  row: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  cardValue: { fontSize: 17, color: '#0F172A', fontWeight: '800', marginTop: 4 },
  cardValueNumeric: { fontSize: 22 },
  ticketCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  ticketTextWrap: { marginLeft: 12, flex: 1 },
  ticketLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  ticketHint: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  ticketValue: { fontSize: 20, fontWeight: '900', color: '#FF6B35' },
  statusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statusChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  statusChipCount: { fontSize: 20, fontWeight: '900' },
  statusChipLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barRow: { marginBottom: 14 },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  barCount: { fontSize: 14, fontWeight: '800' },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    borderRadius: 5,
    minWidth: 0,
  },
  muted: { color: '#94A3B8', marginHorizontal: 16, fontSize: 14 },
  stockCard: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  stockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockText: { flex: 1, marginLeft: 12 },
  stockTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  stockSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  stockNumber: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  stockAlertNumber: { color: '#DC2626' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },
  stockCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF7ED',
    gap: 4,
  },
  stockCtaText: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
});
