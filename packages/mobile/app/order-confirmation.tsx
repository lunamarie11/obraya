import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { api } from '../src/lib/api';
import { OrderStatusStepper } from '../src/components/OrderStatusStepper';
import { colors, radius, shadow } from '../src/theme';
import type { Order } from '@obraya/shared';

async function fetchOrder(orderId: string): Promise<Order> {
  return api.get(`/buyer-orders/${orderId}`).then((r) => r.data);
}

// Espejo de packages/frontend/src/app/order-confirmation/page.tsx (ver ADR-006):
// un checkout puede generar varios pedidos (uno por fabricante), así que acepta
// una lista de orderIds separados por coma en vez de un único orderId.
export default function OrderConfirmationScreen() {
  const { orderIds: orderIdsParam, orderId: legacyOrderId } = useLocalSearchParams<{ orderIds?: string; orderId?: string }>();
  const router = useRouter();

  const orderIds = (orderIdsParam ?? legacyOrderId ?? '').split(',').filter(Boolean);

  const results = useQueries({
    queries: orderIds.map((id) => ({
      queryKey: ['buyer-order', id],
      queryFn: () => fetchOrder(id),
    })),
  });

  const orders = results.map((r) => r.data).filter((o): o is Order => !!o);
  const isLoading = results.some((r) => r.isLoading);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.iconWrap}>
        <CheckCircle2 size={48} color={colors.white} strokeWidth={2.5} />
      </View>

      <Text style={styles.title}>{orderIds.length > 1 ? '¡Pedidos confirmados!' : '¡Pedido confirmado!'}</Text>
      {orders.length > 0 && (
        <Text style={styles.orderNumber}>{orders.map((o) => `#${o.orderNumber}`).join(' · ')}</Text>
      )}
      <Text style={styles.desc}>
        {orderIds.length > 1
          ? 'Tus pedidos fueron registrados. Cada fabricante prepara el suyo y te lo lleva directo a tu obra.'
          : 'Tu pedido fue registrado. Un repartidor lo va a preparar y te va a llevar los materiales directo a tu obra.'}
      </Text>

      {orderIds.length > 0 && (
        <View style={{ width: '100%', gap: 14, marginBottom: 24 }}>
          {isLoading ? (
            <View style={styles.trackingCard}>
              <View style={styles.trackingSkeleton} />
            </View>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <View key={order.id} style={styles.trackingCard}>
                <Text style={styles.trackingLabel}>Seguimiento · Pedido #{order.orderNumber}</Text>
                <OrderStatusStepper status={order.status} />
              </View>
            ))
          ) : (
            <View style={styles.trackingCard}>
              <Text style={styles.trackingError}>No pudimos cargar el estado del pedido.</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
        <ShoppingBag size={18} color={colors.white} />
        <Text style={styles.primaryBtnText}>Seguir comprando</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
        <ArrowRight size={16} color={colors.slate600} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: colors.slate50, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...shadow.card },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900, marginBottom: 6, textAlign: 'center' },
  orderNumber: { fontSize: 13, fontWeight: '600', color: colors.slate400, marginBottom: 10 },
  desc: { fontSize: 14, color: colors.slate500, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  trackingCard: { width: '100%', backgroundColor: colors.white, borderRadius: radius.card, padding: 18, ...shadow.card },
  trackingLabel: { fontSize: 11, fontWeight: '600', color: colors.slate400, textTransform: 'uppercase', marginBottom: 14 },
  trackingSkeleton: { height: 40, backgroundColor: colors.slate100, borderRadius: 12 },
  trackingError: { fontSize: 13, color: colors.slate400 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: radius.card, marginBottom: 12 },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.white, width: '100%', paddingVertical: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.slate200 },
  secondaryBtnText: { color: colors.slate600, fontWeight: '600', fontSize: 14 },
});
