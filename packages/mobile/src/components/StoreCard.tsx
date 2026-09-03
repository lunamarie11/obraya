import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import type { PublicCompany } from '@obraya/shared';
import { colors, radius, shadow } from '../theme';

// Espejo de packages/frontend/src/components/marketplace/StoreCard.tsx.
// Rating/ETA siguen siendo placeholders (ver comentario original y
// docs/adrs/ADR-003) — mismo hash determinístico para no parpadear entre renders.
function placeholderRating(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (4 + (hash % 10) / 10).toFixed(1);
}

function placeholderEta(coverageZones?: string[]): string {
  const zones = coverageZones?.length ?? 0;
  if (zones >= 5) return '30-45 min';
  if (zones >= 1) return '45-60 min';
  return '60-90 min';
}

export function StoreCard({ company }: { company: PublicCompany }) {
  const router = useRouter();
  const initials = company.razonSocial
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

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
          <View style={styles.metaItem}>
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.metaText}>{placeholderRating(company.id)}</Text>
          </View>
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
  location: { fontSize: 11, color: colors.slate400 },
});
