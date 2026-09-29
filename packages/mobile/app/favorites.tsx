import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, LogIn } from 'lucide-react-native';
import { Header } from '../src/components/Header';
import { StoreCard } from '../src/components/StoreCard';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '../src/components/ProductCard';
import { getPublicProduct, getPublicCompany } from '../src/lib/marketplace';
import { addToCart } from '../src/lib/cart';
import { useFavorites } from '../src/hooks/useFavorites';
import { colors, radius, shadow } from '../src/theme';
import type { PublicCompany } from '@obraya/shared';

// Espejo de packages/frontend/src/app/favorites/page.tsx (backlog #4
// marketplace-comprador.md). Los favoritos solo guardan {type, targetId}; acá
// se resuelven contra el catálogo público, igual que en el resto del app.
export default function FavoritesScreen() {
  const router = useRouter();
  const { buyer, favorites } = useFavorites();
  const [addedId, setAddedId] = React.useState<string | null>(null);

  const productIds = favorites.filter((f) => f.type === 'product').map((f) => f.targetId);
  const companyIds = favorites.filter((f) => f.type === 'company').map((f) => f.targetId);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['favorite-products', productIds],
    queryFn: () => Promise.all(productIds.map((id) => getPublicProduct(id))),
    enabled: !!buyer && productIds.length > 0,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['favorite-companies', companyIds],
    queryFn: () => Promise.all(companyIds.map((id) => getPublicCompany(id))),
    enabled: !!buyer && companyIds.length > 0,
  });

  function handleQuickAdd(product: ProductCardData) {
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (buyer === undefined) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack title="Favoritos" showCart={false} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!buyer) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack title="Favoritos" showCart={false} />
        <View style={styles.empty}>
          <LogIn size={48} color={colors.slate300} />
          <Text style={styles.emptyTitle}>Ingresá para ver tus favoritos</Text>
          <Text style={styles.emptyText}>Guardá los productos y fabricantes que más te interesan.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.primaryBtnText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isEmpty = favorites.length === 0;

  return (
    <View style={styles.screen}>
      <Header showSearch={false} showBack title="Favoritos" showCart={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {isEmpty ? (
          <View style={styles.empty}>
            <Heart size={48} color={colors.slate200} />
            <Text style={styles.emptyTitle}>Todavía no tenés favoritos</Text>
            <Text style={styles.emptyText}>Tocá el corazón en un producto o fabricante para guardarlo acá.</Text>
          </View>
        ) : (
          <>
            {companyIds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fabricantes</Text>
                <View style={{ gap: 10 }}>
                  {loadingCompanies
                    ? Array.from({ length: 2 }).map((_, i) => <View key={i} style={styles.skeletonRow} />)
                    : (companies as PublicCompany[]).map((c) => <StoreCard key={c.id} company={c} />)}
                </View>
              </View>
            )}

            {productIds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Productos</Text>
                <View style={styles.grid}>
                  {loadingProducts
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={styles.cell}><ProductCardSkeleton /></View>
                      ))
                    : (products as ProductCardData[]).map((p) => (
                        <View key={p.id} style={styles.cell}>
                          <ProductCard product={p} added={addedId === p.id} onQuickAdd={handleQuickAdd} />
                        </View>
                      ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 16, gap: 24, paddingBottom: 40 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%' },
  skeletonRow: { height: 80, borderRadius: radius.card, backgroundColor: colors.white, opacity: 0.6, ...shadow.card },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.slate800, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.slate500, textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, marginTop: 8 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
