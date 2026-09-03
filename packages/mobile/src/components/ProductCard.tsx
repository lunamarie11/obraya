import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Check, Store, Package } from 'lucide-react-native';
import { formatARS } from '../lib/api';
import { CATEGORIES, CATEGORY_COLORS } from '../constants/categories';
import { colors, radius, shadow } from '../theme';

// Espejo de packages/frontend/src/components/marketplace/ProductCard.tsx.
export interface ProductCardData {
  id: string;
  companyId: string;
  name: string;
  category?: string;
  images?: string[];
  companyName?: string;
  price?: { basePrice: number; finalPrice: number; discountPercent: number };
}

interface Props {
  product: ProductCardData;
  added: boolean;
  onQuickAdd: (product: ProductCardData) => void;
  showStore?: boolean;
}

export function ProductCard({ product, added, onQuickAdd, showStore = true }: Props) {
  const router = useRouter();
  const price = product.price?.finalPrice ?? product.price?.basePrice;
  const bg = CATEGORY_COLORS[product.category ?? ''] ?? CATEGORY_COLORS.default;
  const emoji = CATEGORIES.find((c) => c.key === product.category)?.emoji ?? '📦';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={[styles.imageWrap, { backgroundColor: bg }]}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
        <TouchableOpacity
          style={[styles.addBtn, added ? styles.addBtnActive : styles.addBtnDefault]}
          onPress={() => onQuickAdd(product)}
        >
          {added ? <Check size={16} color={colors.white} /> : <Plus size={16} color={colors.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {showStore && product.companyName && (
          <View style={styles.storeRow}>
            <Store size={11} color={colors.slate400} />
            <Text style={styles.storeName} numberOfLines={1}>{product.companyName}</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{price ? formatARS(price) : '—'}</Text>
          {(product.price?.discountPercent ?? 0) > 0 && (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>-{product.price?.discountPercent}%</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={[styles.card, { opacity: 0.6 }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.slate100 }]}>
        <Package size={28} color={colors.slate300} />
      </View>
      <View style={styles.body}>
        <View style={styles.skeletonLineSmall} />
        <View style={styles.skeletonLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadow.card,
  },
  imageWrap: { height: 140, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 44, opacity: 0.4 },
  addBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  addBtnDefault: { backgroundColor: colors.white },
  addBtnActive: { backgroundColor: colors.green500 },
  body: { padding: 12, gap: 6 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeName: { fontSize: 11, color: colors.slate400, fontWeight: '500', flexShrink: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.slate900, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  discountPill: { backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  discountText: { fontSize: 11, fontWeight: '600', color: colors.green600 },
  skeletonLineSmall: { height: 10, width: '50%', backgroundColor: colors.slate100, borderRadius: 999 },
  skeletonLine: { height: 14, backgroundColor: colors.slate100, borderRadius: 999 },
});
