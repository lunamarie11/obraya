import React from 'react';
import { TextInput, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronLeft, ShoppingBag } from 'lucide-react-native';
import { useCart } from '../hooks/useCart';
import { colors, radius } from '../theme';

// Espejo de packages/frontend/src/components/marketplace/MarketplaceHeader.tsx.
// El botón "Ingresar/Panel" del header web se omite acá porque la tab
// "Perfil" ya cumple ese rol en la bottom tab bar.
interface Props {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  showCart?: boolean;
}

export function Header({
  searchValue = '',
  onSearchChange,
  showSearch = true,
  showBack = false,
  backHref = '/(tabs)',
  title,
  showCart = true,
}: Props) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace(backHref as any))}
          >
            <ChevronLeft size={20} color={colors.slate700} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.logo}>
              Obra<Text style={{ color: colors.primary }}>Ya</Text>
            </Text>
          </TouchableOpacity>
        )}

        {title && !showSearch && (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        )}

        {showSearch && (
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.slate400} style={styles.searchIcon} />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder="¿Qué material necesitás?"
              placeholderTextColor={colors.slate400}
              style={styles.searchInput}
            />
          </View>
        )}

        {showCart && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <ShoppingBag size={20} color={colors.slate700} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: 'rgba(255,255,255,0.96)', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 20, fontWeight: '800', color: colors.slate900, letterSpacing: -0.5 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.slate900 },
  searchWrap: { flex: 1, position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  searchInput: {
    backgroundColor: colors.slate100,
    borderRadius: radius.pill,
    paddingLeft: 36,
    paddingRight: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate900,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
