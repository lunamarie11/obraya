import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { colors, radius } from '../theme';

// Espejo de packages/frontend/src/components/marketplace/CategoryChips.tsx.
interface Props {
  value: string;
  onChange: (key: string) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => {
        const active = value === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => onChange(cat.key)}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  chipActive: { backgroundColor: colors.primary },
  chipInactive: { backgroundColor: colors.slate100 },
  emoji: { fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600' },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.slate600 },
});
