import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, Store, Tag, Layers, Minus, Plus, ShieldCheck } from 'lucide-react-native';
import { Header } from '../../src/components/Header';
import { CartStickyBar } from '../../src/components/CartStickyBar';
import { formatARS } from '../../src/lib/api';
import { getPublicProduct } from '../../src/lib/marketplace';
import { addToCart } from '../../src/lib/cart';
import { colors, radius, shadow } from '../../src/theme';

// Espejo de packages/frontend/src/app/marketplace/products/[id]/page.tsx.
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['public-product', id, selectedVariantId, qty],
    queryFn: () => getPublicProduct(id as string, { variantId: selectedVariantId ?? undefined, quantity: qty }),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (product?.variants?.length && !selectedVariantId) setSelectedVariantId(product.variants[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const totalStock = product?.availableStock ?? null;
  const outOfStock = totalStock === 0;

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      productId: product.id,
      variantId: selectedVariantId,
      companyId: product.companyId,
      name: product.name,
      price: product.price?.finalPrice ?? product.price?.basePrice,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header showBack showSearch={false} title="Producto" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.screen}>
        <Header showBack showSearch={false} title="Producto" />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyTitle}>Producto no encontrado</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>Volver al marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const images: string[] = product.images ?? [];
  const variants = product.variants ?? [];
  const price = product.price?.finalPrice ?? product.price?.basePrice;
  const basePrice = product.price?.basePrice;
  const hasDiscount = (product.price?.discountPercent ?? 0) > 0;

  return (
    <View style={styles.screen}>
      <Header showBack showSearch={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageCard}>
          {images[0] ? (
            <Image source={{ uri: images[0] }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.noImage}>
              <Package size={56} color={colors.slate300} />
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
        </View>

        {product.companyName && (
          <View style={styles.storePill}>
            <Store size={13} color={colors.slate600} />
            <Text style={styles.storePillText}>{product.companyName}</Text>
          </View>
        )}

        <Text style={styles.name}>{product.name}</Text>

        <View style={styles.priceCard}>
          {price ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatARS(price)}</Text>
              {hasDiscount && (
                <>
                  <Text style={styles.priceStrike}>{formatARS(basePrice!)}</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>-{product.price?.discountPercent}%</Text>
                  </View>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.noPrice}>Precio no disponible</Text>
          )}
        </View>

        {variants.length > 0 && (
          <View>
            <View style={styles.sectionLabel}>
              <Layers size={14} color={colors.slate700} />
              <Text style={styles.sectionLabelText}>Variantes</Text>
            </View>
            <View style={styles.variantRow}>
              {variants.map((v) => {
                const active = selectedVariantId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVariantId(v.id)}
                    style={[styles.variantChip, active ? styles.variantChipActive : styles.variantChipDefault]}
                  >
                    <Text style={active ? styles.variantTextActive : styles.variantTextDefault}>{v.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionLabelText}>Cantidad</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={16} color={colors.slate500} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
              <Plus size={16} color={colors.slate500} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: outOfStock ? colors.red500 : colors.green500 }]} />
          <Text style={styles.stockText}>
            {outOfStock ? 'Sin stock disponible' : `${totalStock} unidades disponibles`}
          </Text>
        </View>

        <TouchableOpacity
          disabled={outOfStock}
          onPress={handleAddToCart}
          style={[styles.cta, added ? styles.ctaAdded : outOfStock ? styles.ctaDisabled : styles.ctaDefault]}
        >
          <Text style={styles.ctaText}>
            {added ? '✓ Agregado al carrito' : outOfStock ? 'Sin stock' : 'Agregar al carrito'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secureRow}>
          <ShieldCheck size={14} color={colors.green500} />
          <Text style={styles.secureText}>Compra segura. Un repartidor lo lleva directamente a tu obra.</Text>
        </View>

        {product.category && (
          <View style={styles.categoryCard}>
            <View style={styles.sectionLabel}>
              <Tag size={14} color={colors.slate700} />
              <Text style={styles.sectionLabelText}>Categoría</Text>
            </View>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        )}
      </ScrollView>

      <CartStickyBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  imageCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  image: { width: '100%', height: '100%' },
  noImage: { alignItems: 'center', gap: 8, opacity: 0.5 },
  noImageText: { fontSize: 13, color: colors.slate400, fontWeight: '500' },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  storePillText: { fontSize: 13, fontWeight: '500', color: colors.slate600 },
  name: { fontSize: 22, fontWeight: '800', color: colors.slate900, lineHeight: 28 },
  priceCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadow.card },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 26, fontWeight: '800', color: colors.slate900 },
  priceStrike: { fontSize: 15, color: colors.slate400, textDecorationLine: 'line-through' },
  discountPill: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  discountText: { fontSize: 12, fontWeight: '700', color: colors.green600 },
  noPrice: { fontSize: 13, color: colors.slate400 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabelText: { fontSize: 13, fontWeight: '600', color: colors.slate700, marginBottom: 8 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  variantChipDefault: { backgroundColor: colors.slate100 },
  variantChipActive: { backgroundColor: colors.primary },
  variantTextDefault: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  variantTextActive: { fontSize: 13, fontWeight: '600', color: colors.white },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  qtyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 40, textAlign: 'center', fontWeight: '700', color: colors.slate900 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, color: colors.slate600 },
  cta: { paddingVertical: 16, borderRadius: radius.card, alignItems: 'center' },
  ctaDefault: { backgroundColor: colors.primary },
  ctaAdded: { backgroundColor: colors.green500 },
  ctaDisabled: { backgroundColor: colors.slate300 },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 11, color: colors.slate400, flex: 1 },
  categoryCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadow.card },
  categoryText: { fontSize: 13, color: colors.slate600, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.slate800, marginBottom: 12 },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, marginTop: 8 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
