import React from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../src/components/Header';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '../../src/components/ProductCard';
import { CartStickyBar } from '../../src/components/CartStickyBar';
import { getPublicCompany, getPublicCompanyProducts } from '../../src/lib/marketplace';
import { addToCart } from '../../src/lib/cart';
import { colors } from '../../src/theme';

// Espejo de packages/frontend/src/app/marketplace/[companyId]/page.tsx.
export default function CompanyStoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = id ?? '';

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: company } = useQuery({
    queryKey: ['public-company', companyId],
    queryFn: () => getPublicCompany(companyId),
    enabled: !!companyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-company-products', companyId, debouncedSearch],
    queryFn: () => getPublicCompanyProducts(companyId, { search: debouncedSearch || undefined, limit: 100 }),
    enabled: !!companyId,
  });

  const products: ProductCardData[] = data?.data ?? [];

  const grouped = React.useMemo(() => {
    const groups = new Map<string, ProductCardData[]>();
    for (const p of products) {
      const key = p.category || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries());
  }, [products]);

  function handleQuickAdd(product: ProductCardData) {
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <View style={styles.screen}>
      <Header showBack showSearch={false} title={company?.razonSocial ?? 'Tienda'} />

      <FlatList
        data={grouped}
        keyExtractor={([category]) => category}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Buscar en ${company?.razonSocial ?? 'esta tienda'}...`}
            placeholderTextColor={colors.slate400}
            style={styles.search}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>Sin productos</Text>
              <Text style={styles.emptyText}>Esta tienda todavía no tiene productos publicados con esa búsqueda.</Text>
            </View>
          )
        }
        renderItem={({ item: [category, items] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <View style={styles.grid}>
              {items.map((p) => (
                <View key={p.id} style={styles.cell}>
                  <ProductCard product={p} added={addedId === p.id} onQuickAdd={handleQuickAdd} showStore={false} />
                </View>
              ))}
            </View>
          </View>
        )}
      />

      <CartStickyBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  list: { padding: 16 },
  search: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.slate900, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.slate800 },
  emptyText: { fontSize: 13, color: colors.slate500, textAlign: 'center', maxWidth: 260 },
});
