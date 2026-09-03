import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, ShoppingBag, ArrowRight, LogIn } from 'lucide-react-native';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { api, formatARS } from '../../src/lib/api';
import { getStoredBuyer, type BuyerUser } from '../../src/lib/buyer-auth';
import { colors, radius, shadow } from '../../src/theme';
import type { Order } from '@obraya/shared';

async function fetchOrders(): Promise<Order[]> {
  return api.get('/buyer-orders').then((r) => r.data);
}

// Espejo de packages/frontend/src/app/my-orders/page.tsx (ver ADR-006): pasa
// de un historial local (ADR-004) a listar los pedidos reales del comprador
// logueado contra /buyer-orders. Sin sesión de Buyer, muestra un CTA a Perfil.
export default function MyOrdersScreen() {
  const router = useRouter();
  const [buyer, setBuyer] = React.useState<BuyerUser | null | undefined>(undefined);

  useFocusEffect(
    React.useCallback(() => {
      getStoredBuyer().then(setBuyer);
    }, []),
  );

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: fetchOrders,
    enabled: !!buyer,
  });

  const orders = (data ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (buyer === undefined) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack showCart={false} title="Mis pedidos" />
      </View>
    );
  }

  if (!buyer) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack showCart={false} title="Mis pedidos" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <LogIn size={36} color="#fdba74" />
          </View>
          <Text style={styles.emptyTitle}>Ingresá para ver tus pedidos</Text>
          <Text style={styles.emptyText}>Con tu cuenta podés hacer seguimiento de tus pedidos y repetirlos en un toque.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.primaryBtnText}>Ingresar</Text>
            <ArrowRight size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header showSearch={false} showBack showCart={false} title="Mis pedidos" />
      <FlatList
        data={isLoading ? [] : orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <ShoppingBag size={36} color="#fdba74" />
              </View>
              <Text style={styles.emptyTitle}>Todavía no hiciste pedidos</Text>
              <Text style={styles.emptyText}>Tus pedidos aparecen acá apenas completás una compra.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.primaryBtnText}>Explorar marketplace</Text>
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item: order }) => {
          const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
          return (
            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => router.push(`/my-orders/${order.id}`)}>
              <View style={styles.rowIcon}>
                <Package size={20} color={colors.primary} />
              </View>
              <View style={styles.rowInfo}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowNumber} numberOfLines={1}>Pedido #{order.orderNumber}</Text>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={styles.rowMeta}>
                  {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}{itemCount} ítem{itemCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.rowTotal}>{formatARS(order.totalAmount)}</Text>
              <ChevronRight size={18} color={colors.slate300} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowNumber: { fontSize: 13, fontWeight: '700', color: colors.slate900, flexShrink: 1 },
  rowMeta: { fontSize: 11, color: colors.slate400 },
  rowTotal: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.slate900, marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.slate500, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
