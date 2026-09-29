import React from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, RotateCcw, ShoppingBag, Star } from 'lucide-react-native';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { OrderStatusStepper } from '../../src/components/OrderStatusStepper';
import { api, formatARS } from '../../src/lib/api';
import { addToCart } from '../../src/lib/cart';
import { getMyReviews, createReview } from '../../src/lib/marketplace';
import { colors, radius, shadow } from '../../src/theme';
import type { Order } from '@obraya/shared';

async function fetchOrder(orderId: string): Promise<Order> {
  return api.get(`/buyer-orders/${orderId}`).then((r) => r.data);
}

// Espejo de packages/frontend/src/app/my-orders/[id]/page.tsx (ver ADR-006):
// pasa de /orders/:id (backoffice) a /buyer-orders/:id (comprador logueado).
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['buyer-order', id],
    queryFn: () => fetchOrder(id as string),
    enabled: !!id,
  });

  function handleReorder() {
    if (!order) return;
    order.items.forEach((item) => {
      addToCart({
        productId: item.productId,
        variantId: item.variantId ?? null,
        companyId: order.companyId,
        name: item.productName ?? 'Producto',
        price: item.unitPrice,
        quantity: item.quantity,
      });
    });
    router.push('/(tabs)/cart');
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack showCart={false} title="Pedido" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack showCart={false} title="Pedido" />
        <View style={styles.empty}>
          <Package size={44} color={colors.slate300} />
          <Text style={styles.emptyTitle}>No pudimos cargar este pedido</Text>
          <Text style={styles.emptyText}>Puede que ya no exista o que necesites iniciar sesión de nuevo.</Text>
        </View>
      </View>
    );
  }

  const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;

  return (
    <View style={styles.screen}>
      <Header showSearch={false} showBack showCart={false} title={`Pedido #${order.orderNumber}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.trackingHeader}>
            <Text style={styles.label}>Seguimiento</Text>
            <StatusBadge status={order.status} />
          </View>
          <OrderStatusStepper status={order.status} />
          {order.status === 'Cancelado' && order.rejectionReason && (
            <Text style={styles.rejectionText}>Motivo: {order.rejectionReason}</Text>
          )}
        </View>

        {order.deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <MapPin size={14} color={colors.slate400} />
              <Text style={styles.label}>Entrega en</Text>
            </View>
            <Text style={styles.strong}>{order.deliveryAddress.street}</Text>
            <Text style={styles.muted}>
              {[order.deliveryAddress.city, order.deliveryAddress.province, order.deliveryAddress.postalCode]
                .filter(Boolean)
                .join(', ')}
            </Text>
            {order.deliveryAddress.notes && <Text style={styles.muted}>{order.deliveryAddress.notes}</Text>}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>{itemCount} ítem{itemCount !== 1 ? 's' : ''}</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName ?? 'Producto'} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>{formatARS(item.subtotal)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatARS(order.totalAmount)}</Text>
          </View>
        </View>

        {order.status === 'Entregado' && <ReviewSection orderId={order.id} />}

        <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
          <RotateCcw size={18} color={colors.white} />
          <Text style={styles.reorderText}>Repetir pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/(tabs)')}>
          <ShoppingBag size={16} color={colors.slate500} />
          <Text style={styles.continueText}>Seguir comprando</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Calificar un pedido entregado (backlog #6 marketplace-comprador.md, ver
// ADR-008). Espejo de ReviewSection en frontend/src/app/my-orders/[id]/page.tsx.
// Un pedido admite una sola reseña: si ya existe, se muestra en modo lectura.
function ReviewSection({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const { data: myReviews, isLoading } = useQuery({
    queryKey: ['buyer-reviews-mine'],
    queryFn: getMyReviews,
  });

  const existingReview = myReviews?.find((r) => r.orderId === orderId);

  async function handleSubmit() {
    if (rating < 1) {
      setError('Elegí una cantidad de estrellas');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ orderId, rating, comment: comment.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ['buyer-reviews-mine'] });
    } catch {
      setError('No pudimos guardar tu reseña. Probá de nuevo en unos minutos.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{existingReview ? 'Tu calificación' : 'Calificá este pedido'}</Text>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const filled = existingReview ? value <= existingReview.rating : value <= rating;
          return (
            <TouchableOpacity key={value} disabled={!!existingReview} onPress={() => setRating(value)}>
              <Star size={26} color={filled ? '#fbbf24' : colors.slate200} fill={filled ? '#fbbf24' : 'transparent'} />
            </TouchableOpacity>
          );
        })}
      </View>

      {existingReview ? (
        existingReview.comment ? <Text style={styles.reviewComment}>{existingReview.comment}</Text> : null
      ) : (
        <>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Contanos cómo fue tu experiencia (opcional)"
            placeholderTextColor={colors.slate400}
            multiline
            numberOfLines={3}
            maxLength={1000}
            style={styles.reviewInput}
          />
          {error && <Text style={styles.rejectionText}>{error}</Text>}
          <TouchableOpacity disabled={submitting} style={[styles.reorderBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit}>
            <Text style={styles.reorderText}>{submitting ? 'Enviando...' : 'Enviar calificación'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: 18, ...shadow.card },
  trackingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '600', color: colors.slate400, textTransform: 'uppercase' },
  rejectionText: { fontSize: 13, color: colors.red500, marginTop: 14 },
  strong: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  muted: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: colors.slate50, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  itemName: { flex: 1, fontSize: 13, color: colors.slate700 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: 14, marginTop: 14 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  totalValue: { fontSize: 19, fontWeight: '800', color: colors.slate900 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  reviewComment: { fontSize: 13, color: colors.slate700 },
  reviewInput: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.slate900, textAlignVertical: 'top', minHeight: 70 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.card },
  reorderText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  continueText: { fontSize: 13, color: colors.slate500, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.slate800, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
});
