import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { useCart } from '../hooks/useCart';
import { formatARS } from '../lib/api';
import { colors, radius, shadow } from '../theme';

// Espejo de packages/frontend/src/components/cart/CartStickyBar.tsx. Se
// auto-oculta en /cart y /checkout, igual que la versión web.
export function CartStickyBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, total } = useCart();

  if (count === 0) return null;
  if (pathname?.includes('/cart') || pathname?.includes('/checkout')) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.bar} activeOpacity={0.9} onPress={() => router.push('/(tabs)/cart')}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <ShoppingBag size={16} color={colors.white} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
          </View>
          <Text style={styles.label}>Ver carrito</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>{formatARS(total)}</Text>
          <ChevronRight size={16} color={colors.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 8, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.slate900,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadow.card,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  label: { color: colors.white, fontSize: 14, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  total: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
