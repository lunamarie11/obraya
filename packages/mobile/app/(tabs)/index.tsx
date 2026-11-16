import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Header } from '../../src/components/Header';
import { CategoryChips } from '../../src/components/CategoryChips';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '../../src/components/ProductCard';
import { CartStickyBar } from '../../src/components/CartStickyBar';
import { searchPublicProducts, getSponsoredBanners } from '../../src/lib/marketplace';
import { addToCart } from '../../src/lib/cart';
import { CATEGORIES } from '../../src/constants/categories';
import { colors } from '../../src/theme';

// Espejo de packages/frontend/src/app/marketplace/page.tsx. Se omiten el
// panel de filtros de precio y el selector de orden (no forman parte del
// alcance mínimo de paridad definido en ADR-005); búsqueda, categorías,
// grilla y paginación sí están presentes.
export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search: debouncedSearch, category }],
    queryFn: () =>
      searchPublicProducts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        category: category || undefined,
      }),
  });

  const products: ProductCardData[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Banner publicitario pago (ver ADR-021): mismo endpoint que la web, rota
  // cada 5s si hay más de un anunciante activo.
  const { data: sponsoredBanners } = useQuery({
    queryKey: ['sponsored-banners'],
    queryFn: getSponsoredBanners,
  });

  const [bannerIndex, setBannerIndex] = React.useState(0);
  React.useEffect(() => {
    if (!sponsoredBanners || sponsoredBanners.length < 2) return;
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % sponsoredBanners.length), 5000);
    return () => clearInterval(t);
  }, [sponsoredBanners]);

  const activeBanner = sponsoredBanners?.[bannerIndex];

  function handleQuickAdd(product: ProductCardData) {
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <View style={styles.screen}>
      <Header searchValue={search} onSearchChange={setSearch} />
      {activeBanner && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.push(`/company/${activeBanner.companyId}`)}
        >
          <Text style={styles.bannerTag}>Publicidad</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              {activeBanner.companyName} · {activeBanner.title}
            </Text>
            {activeBanner.subtitle ? (
              <Text style={styles.bannerSubtitle} numberOfLines={1}>{activeBanner.subtitle}</Text>
            ) : null}
          </View>
          <Text style={styles.bannerCta}>{activeBanner.ctaLabel}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.chipsWrap}>
        <CategoryChips value={category} onChange={(key) => { setCategory(key); setPage(1); }} />
      </View>

      <FlatList
        data={isLoading ? Array.from({ length: 6 }) : products}
        keyExtractor={(item: any, i) => item?.id ?? String(i)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.count}>
            {isLoading ? 'Buscando...' : `${data?.total ?? 0} producto${data?.total !== 1 ? 's' : ''}`}
            {category ? ` en ${CATEGORIES.find((c) => c.key === category)?.label}` : ''}
          </Text>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Probá con otra búsqueda o categoría.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              >
                <ChevronLeft size={18} color={colors.slate600} />
              </TouchableOpacity>
              <Text style={styles.pageText}>{page} / {totalPages}</Text>
              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              >
                <ChevronRight size={18} color={colors.slate600} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item, index }) =>
          isLoading ? (
            <View style={styles.cell}><ProductCardSkeleton /></View>
          ) : (
            <View style={styles.cell}>
              <ProductCard product={item} added={addedId === item.id} onQuickAdd={handleQuickAdd} />
            </View>
          )
        }
      />

      <CartStickyBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.slate800,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bannerText: { flex: 1, minWidth: 0 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: colors.white },
  bannerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bannerCta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipsWrap: { backgroundColor: 'rgba(255,255,255,0.92)', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  list: { padding: 16, gap: 12 },
  cell: { flex: 1 },
  count: { fontSize: 13, color: colors.slate500, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.slate800 },
  emptyText: { fontSize: 13, color: colors.slate500, textAlign: 'center', maxWidth: 260 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.slate600 },
});
