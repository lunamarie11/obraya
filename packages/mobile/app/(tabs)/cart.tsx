import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react-native';
import { Header } from '../../src/components/Header';
import { formatARS } from '../../src/lib/api';
import { removeFromCart, updateCartItemQuantity, clearCart, type CartItem } from '../../src/lib/cart';
import { useCart } from '../../src/hooks/useCart';
import { colors, radius, shadow } from '../../src/theme';

// Espejo de packages/frontend/src/app/cart/page.tsx.
export default function CartScreen() {
  const router = useRouter();
  const { cart, count, total } = useCart();

  if (!cart.length) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack showCart={false} title="Carrito" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <ShoppingBag size={36} color="#fdba74" />
          </View>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyText}>Agregá materiales desde el marketplace para empezar tu compra.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.primaryBtnText}>Explorar marketplace</Text>
            <ArrowRight size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header showSearch={false} showBack showCart={false} title="Carrito" />
      <FlatList
        data={cart}
        keyExtractor={(item) => `${item.productId}-${item.variantId ?? 'base'}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.itemCount}>{count} ítem{count !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => clearCart()}>
              <Text style={styles.clearText}>Vaciar carrito</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <CartRow
            item={item}
            onQuantityChange={(qty) => updateCartItemQuantity(item.productId, item.variantId ?? null, qty)}
            onRemove={() => removeFromCart(item.productId, item.variantId ?? undefined)}
          />
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            {cart.map((item) => (
              <View key={`${item.productId}-${item.variantId ?? 'base'}`} style={styles.summaryRow}>
                <Text style={styles.summaryItem} numberOfLines={1}>{item.name} × {item.quantity}</Text>
                <Text style={styles.summaryPrice}>{item.price ? formatARS(item.price * item.quantity) : '—'}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatARS(total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutBtnText}>Ir al checkout</Text>
              <ArrowRight size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.continueBtnText}>Seguir comprando</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

function CartRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowImage}>
        <Package size={22} color={colors.slate300} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
        {item.variantId && <Text style={styles.rowVariant}>Variante seleccionada</Text>}
        <Text style={styles.rowPrice}>{item.price ? formatARS(item.price) : '—'}</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onQuantityChange(item.quantity - 1)}>
          <Minus size={14} color={colors.slate500} />
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onQuantityChange(item.quantity + 1)}>
          <Plus size={14} color={colors.slate500} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Trash2 size={16} color={colors.slate300} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  list: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  itemCount: { fontSize: 17, fontWeight: '700', color: colors.slate900 },
  clearText: { fontSize: 13, color: colors.slate400, fontWeight: '600' },
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
  rowImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 13, fontWeight: '600', color: colors.slate900 },
  rowVariant: { fontSize: 11, color: colors.slate400 },
  rowPrice: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200, borderRadius: 999, backgroundColor: colors.slate50 },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.slate900 },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.white, borderRadius: radius.card, padding: 18, marginTop: 8, ...shadow.card },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItem: { fontSize: 13, color: colors.slate600, flex: 1, marginRight: 8 },
  summaryPrice: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: 14, marginTop: 8, marginBottom: 16 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: colors.slate800 },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.slate900 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.card },
  checkoutBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  continueBtn: { alignItems: 'center', paddingVertical: 12 },
  continueBtnText: { fontSize: 13, color: colors.slate500, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.slate900, marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.slate500, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 999 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
