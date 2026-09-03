import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { OrderStatus } from '@obraya/shared';
import { statusColors, radius } from '../theme';

// Equivalente RN de las clases .badge-* de globals.css.
export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = statusColors[status] ?? statusColors.Nuevo;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
