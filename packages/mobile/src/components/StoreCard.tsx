import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Clock, Heart } from 'lucide-react-native';
import type { PublicCompany } from '@obraya/shared';
import { colors, radius, shadow } from '../theme';
import { useFavorites } from '../hooks/useFavorites';

// Espejo de packages/frontend/src/components/marketplace/StoreCard.tsx.
// El rating es un dato real agregado desde Review (ver ADR-008) — se dejó de
// usar el hash placeholder. El ETA de entrega sigue siendo placeholder hasta
// que exista un modelo de logística real (no expandir, ver ADR-003).
function placeholderEta(coverageZones?: string[]): string {
  const zones = coverageZones?.length ?? 0;
  if (zones >= 5) return '30-45 min';
  if (zones >= 1) return '45-60 min';
  return '60-90 min';
}

export function StoreCard({ company }: { company: PublicCompany }) {
  const router = useRouter();
  const { buyer, isFavorite, toggle } = useFavorites();
  const favorited = isFavorite('company', company.id);
  const initials = company.razonSocial
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  function handleToggleFavorite() {
    if (!buyer) {
      router.push('/(tabs)/profile');
      return;
    }
    toggle('company', company.id);
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/company/${company.id}`)}>
      <View style={styles.logo}>
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={styles.logoImage} resizeMode="cover" />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{company.razonSocial}</Text>
        <View style={styles.metaRow}>
          {company.reviewCount ? (
            <View style={styles.metaItem}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.metaText}>{company.averageRating?.toFixed(1)}</Text>
              <Text style={styles.metaMuted}>({company.reviewCount})</Text>
            </View>
          ) : (
            <View style={styles.metaItem}>
              <Star size={12} color={colors.slate400} />
              <Text style={styles.metaMuted}>Nuevo</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.slate500} />
            <Text style={styles.metaText}>{placeholderEta(company.coverageZones)}</Text>
          </View>
        </View>
        {(company.city || company.province) && (
          <Text style={styles.location} numberOfLines={1}>
            {[company.city, company.province].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.favBtn, favorited && styles.favBtnActive]}
        onPress={handleToggleFavorite}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Heart size={16} color={favorited ? '#ef4444' : colors.slate300} fill={favorited ? '#ef4444' : 'none'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadow.card,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  initials: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.slate500 },
  metaMuted: { fontSize: 12, color: colors.slate400 },
  location: { fontSize: 11, color: colors.slate400 },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: { backgroundColor: '#fef2f2' },
});
