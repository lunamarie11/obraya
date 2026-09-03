import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import type { OrderStatus } from '@obraya/shared';
import { colors, statusColors } from '../theme';

// Espejo de packages/frontend/src/components/order/OrderStatusStepper.tsx.
// 5 pasos del camino feliz (ver VALID_TRANSITIONS en
// packages/backend/src/modules/orders/entities/order.entity.ts). "Cancelado"
// se muestra aparte como banner, no como paso.
const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'Nuevo', label: 'Nuevo' },
  { key: 'Aceptado', label: 'Aceptado' },
  { key: 'Preparacion', label: 'Preparación' },
  { key: 'Despachado', label: 'Despachado' },
  { key: 'Entregado', label: 'Entregado' },
];

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'Cancelado') {
    const c = statusColors.Cancelado;
    return (
      <View style={[styles.cancelBanner, { backgroundColor: c.bg }]}>
        <Text style={[styles.cancelText, { color: c.text }]}>Este pedido fue cancelado</Text>
      </View>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <View style={styles.row}>
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.step}>
              <View
                style={[
                  styles.circle,
                  done ? styles.circleDone : active ? styles.circleActive : styles.circlePending,
                ]}
              >
                {done ? <Check size={14} color={colors.white} /> : (
                  <Text style={[styles.circleText, active ? styles.circleTextActive : styles.circleTextPending]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.label, active ? styles.labelActive : done ? styles.labelDone : styles.labelPending]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.connector, done ? styles.connectorDone : styles.connectorPending]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { alignItems: 'center', gap: 6, width: 44 },
  circle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: colors.green500 },
  circleActive: { backgroundColor: colors.primary },
  circlePending: { backgroundColor: colors.slate200 },
  circleText: { fontSize: 11, fontWeight: '700' },
  circleTextActive: { color: colors.white },
  circleTextPending: { color: colors.slate400 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: colors.primary },
  labelDone: { color: colors.green600 },
  labelPending: { color: colors.slate400 },
  connector: { flex: 1, height: 2, marginHorizontal: 2, marginBottom: 16 },
  connectorDone: { backgroundColor: colors.green500 },
  connectorPending: { backgroundColor: colors.slate200 },
  cancelBanner: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, alignSelf: 'flex-start' },
  cancelText: { fontSize: 13, fontWeight: '600' },
});
