import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, CheckCircle2, ArrowRight, Minus, Plus, Wallet, Landmark, LogIn, Trash2 } from 'lucide-react-native';
import { Header } from '../src/components/Header';
import { api, formatARS } from '../src/lib/api';
import { clearCart, updateCartItemQuantity, getCartGroupedByCompany } from '../src/lib/cart';
import { getStoredBuyer, type BuyerUser } from '../src/lib/buyer-auth';
import { getBuyerAddresses, createBuyerAddress, deleteBuyerAddress, type BuyerAddress } from '../src/lib/addresses';
import { useCart } from '../src/hooks/useCart';
import { colors, radius, shadow } from '../src/theme';

// Espejo de packages/frontend/src/app/checkout/page.tsx (ver ADR-006): exige
// sesión de Buyer (no CompanyUser) y crea un pedido por fabricante contra
// /buyer-orders, agrupando el carrito con getCartGroupedByCompany().
const STEPS = ['Dirección', 'Método de pago', 'Resumen'] as const;
type Step = 0 | 1 | 2;
type PaymentMethod = 'efectivo' | 'transferencia';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo / contra-entrega', desc: 'Pagás cuando lo recibís en tu obra.', icon: Wallet },
  { value: 'transferencia', label: 'Transferencia bancaria', desc: 'Te compartimos los datos por chat con el vendedor.', icon: Landmark },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, total, count } = useCart();
  const [step, setStep] = React.useState<Step>(0);
  const [buyer, setBuyer] = React.useState<BuyerUser | null | undefined>(undefined);

  const [buyerName, setBuyerName] = React.useState('');
  const [buyerEmail, setBuyerEmail] = React.useState('');
  const [buyerPhone, setBuyerPhone] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [address, setAddress] = React.useState({ street: '', city: '', province: '', postalCode: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('efectivo');

  React.useEffect(() => {
    getStoredBuyer().then((b) => {
      setBuyer(b);
      if (b) {
        setBuyerName(`${b.firstName} ${b.lastName}`.trim());
        setBuyerEmail(b.email);
      }
    });
  }, []);

  // Libreta de direcciones del comprador (backlog #3 marketplace-comprador.md)
  const queryClient = useQueryClient();
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['buyer-addresses'],
    queryFn: getBuyerAddresses,
    enabled: !!buyer,
  });
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [saveNewAddress, setSaveNewAddress] = React.useState(true);

  function selectSavedAddress(addr: BuyerAddress) {
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
    setAddress({ street: addr.street, city: addr.city, province: addr.province, postalCode: addr.postalCode, notes: addr.notes ?? '' });
  }

  // Preseleccionar la dirección default (o la primera) apenas llegan del backend
  React.useEffect(() => {
    if (!selectedAddressId && savedAddresses.length > 0) {
      selectSavedAddress(savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const createAddressMutation = useMutation({
    mutationFn: createBuyerAddress,
    onSuccess: (addr) => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
      selectSavedAddress(addr);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteBuyerAddress,
    onSuccess: (_data: void, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['buyer-addresses'] });
      if (selectedAddressId === id) setSelectedAddressId(null);
    },
  });

  const useManualForm = showAddressForm || savedAddresses.length === 0;

  async function handleContinueFromAddress() {
    if (useManualForm && saveNewAddress && address.street.trim() && address.city.trim()) {
      try {
        await createAddressMutation.mutateAsync({
          street: address.street,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          notes: address.notes || undefined,
          isDefault: savedAddresses.length === 0,
        });
      } catch {
        // Si falla el guardado, igual dejamos avanzar con la dirección ingresada.
      }
    }
    setStep(1);
  }

  // El carrito puede tener productos de varios fabricantes: se crea un pedido
  // por fabricante (companyId) contra /buyer-orders — ver ADR-006.
  const createOrder = useMutation({
    mutationFn: async () => {
      const groups = await getCartGroupedByCompany();
      const orders = await Promise.all(
        groups.map((group) =>
          api
            .post('/buyer-orders', {
              companyId: group.companyId,
              items: group.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.name,
                productSku: '',
                quantity: item.quantity,
                unitPrice: item.price ?? 0,
                discountPercent: 0,
              })),
              buyerName,
              buyerEmail,
              buyerPhone,
              notes: `Método de pago: ${paymentMethod === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo / contra-entrega'}.${notes ? ` ${notes}` : ''}`,
              deliveryAddress: address,
            })
            .then((r) => r.data),
        ),
      );
      return orders;
    },
    onSuccess: async (orders) => {
      await clearCart();
      const orderIds = orders.map((o: any) => o.id).join(',');
      router.replace({ pathname: '/order-confirmation', params: { orderIds } });
    },
  });

  if (buyer === undefined) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack title="Checkout" showCart={false} />
      </View>
    );
  }

  if (!buyer) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack title="Checkout" showCart={false} />
        <View style={styles.empty}>
          <LogIn size={48} color={colors.slate300} />
          <Text style={styles.emptyTitle}>Ingresá para continuar</Text>
          <Text style={styles.emptyText}>Necesitás una cuenta para hacer el pedido y hacerle seguimiento.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.primaryBtnText}>Ingresar</Text>
            <ArrowRight size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!cart.length) {
    return (
      <View style={styles.screen}>
        <Header showSearch={false} showBack title="Checkout" showCart={false} />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>No hay productos</Text>
          <Text style={styles.emptyText}>Agregá materiales antes de continuar.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>Ir al marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const canGoStep1 = buyerName.trim() && buyerEmail.trim() && address.street.trim() && address.city.trim();

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showSearch={false} showBack title="Checkout" showCart={false} />

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending]}>
                {i < step ? <CheckCircle2 size={16} color={colors.white} /> : (
                  <Text style={[styles.stepNum, i === step ? { color: colors.white } : { color: colors.slate400 }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === step && { color: colors.primary }]}>{s}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepConnector, i < step && { backgroundColor: colors.green500 }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Dirección de entrega</Text>
            </View>
            <Field label="Nombre completo *" value={buyerName} onChange={setBuyerName} placeholder="Juan García" />
            <Field label="Email *" value={buyerEmail} onChange={setBuyerEmail} placeholder="juan@email.com" keyboardType="email-address" />
            <Field label="Teléfono" value={buyerPhone} onChange={setBuyerPhone} placeholder="+54 11 1234-5678" keyboardType="phone-pad" />

            {savedAddresses.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>Tus direcciones guardadas</Text>
                {savedAddresses.map((addr) => {
                  const active = !useManualForm && selectedAddressId === addr.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      onPress={() => selectSavedAddress(addr)}
                      style={[styles.addressOption, active ? styles.addressOptionActive : styles.addressOptionDefault]}
                    >
                      <MapPin size={18} color={active ? colors.primary : colors.slate400} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.addressLabelRow}>
                          <Text style={styles.addressLabel}>{addr.label}</Text>
                          {addr.isDefault && (
                            <View style={styles.addressBadge}>
                              <Text style={styles.addressBadgeText}>Predeterminada</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressStreet} numberOfLines={1}>{addr.street}</Text>
                        <Text style={styles.addressSub} numberOfLines={1}>
                          {[addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteAddressMutation.mutate(addr.id)}
                        style={styles.addressDeleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={colors.slate300} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
                {!showAddressForm && (
                  <TouchableOpacity onPress={() => setShowAddressForm(true)} style={{ paddingVertical: 6 }}>
                    <Text style={styles.addAddressText}>+ Agregar nueva dirección</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {useManualForm && (
              <View>
                {savedAddresses.length > 0 && <Text style={styles.fieldLabel}>Nueva dirección</Text>}
                <Field label="Calle y número *" value={address.street} onChange={(v) => setAddress({ ...address, street: v })} placeholder="Av. Corrientes 1234" />
                <Field label="Ciudad *" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} placeholder="Buenos Aires" />
                <Field label="Provincia" value={address.province} onChange={(v) => setAddress({ ...address, province: v })} placeholder="CABA" />
                <Field label="Código postal" value={address.postalCode} onChange={(v) => setAddress({ ...address, postalCode: v })} placeholder="C1043" />
                <Field label="Piso / Depto / Referencias" value={address.notes} onChange={(v) => setAddress({ ...address, notes: v })} placeholder="2° B, timbre García" />
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSaveNewAddress(!saveNewAddress)}
                >
                  <View style={[styles.checkbox, saveNewAddress && styles.checkboxChecked]}>
                    {saveNewAddress && <CheckCircle2 size={14} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Guardar esta dirección para la próxima</Text>
                </TouchableOpacity>
              </View>
            )}

            <Field label="Notas del pedido" value={notes} onChange={setNotes} placeholder="Instrucciones especiales..." multiline />
            <TouchableOpacity
              disabled={!canGoStep1 || createAddressMutation.isPending}
              style={[styles.nextBtn, (!canGoStep1 || createAddressMutation.isPending) && styles.nextBtnDisabled]}
              onPress={handleContinueFromAddress}
            >
              <Text style={styles.nextBtnText}>{createAddressMutation.isPending ? 'Guardando...' : 'Siguiente'}</Text>
              {!createAddressMutation.isPending && <ArrowRight size={18} color={colors.white} />}
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Wallet size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Método de pago</Text>
            </View>
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = paymentMethod === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPaymentMethod(opt.value)}
                  style={[styles.paymentOption, active ? styles.paymentOptionActive : styles.paymentOptionDefault]}
                >
                  <Icon size={20} color={active ? colors.primary : colors.slate400} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentLabel}>{opt.label}</Text>
                    <Text style={styles.paymentDesc}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.rowGap}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                <Text style={styles.backBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnFlex} onPress={() => setStep(2)}>
                <Text style={styles.nextBtnText}>Siguiente</Text>
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Package size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Confirmá tu pedido</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Comprador</Text>
              <Text style={styles.infoStrong}>{buyerName}</Text>
              <Text style={styles.infoText}>{buyerEmail}</Text>
              {buyerPhone ? <Text style={styles.infoText}>{buyerPhone}</Text> : null}
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Entrega en</Text>
              <Text style={styles.infoStrong}>{address.street}</Text>
              <Text style={styles.infoText}>{[address.city, address.province, address.postalCode].filter(Boolean).join(', ')}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Pago</Text>
              <Text style={styles.infoStrong}>{PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label}</Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.infoLabel}>Tu pedido (editable)</Text>
              {cart.map((item) => (
                <View key={`${item.productId}-${item.variantId ?? 'base'}`} style={styles.orderRow}>
                  <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartItemQuantity(item.productId, item.variantId ?? null, item.quantity - 1)}>
                      <Minus size={14} color={colors.slate500} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartItemQuantity(item.productId, item.variantId ?? null, item.quantity + 1)}>
                      <Plus size={14} color={colors.slate500} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.orderItemPrice}>{item.price ? formatARS(item.price * item.quantity) : '—'}</Text>
                </View>
              ))}
            </View>

            {createOrder.isError && (
              <Text style={styles.errorText}>Error al procesar el pedido. Verificá los datos e intentá de nuevo.</Text>
            )}

            <View style={styles.rowGap}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={createOrder.isPending}
                style={[styles.nextBtnFlex, createOrder.isPending && styles.nextBtnDisabled]}
                onPress={() => createOrder.mutate()}
              >
                <Text style={styles.nextBtnText}>{createOrder.isPending ? 'Procesando...' : 'Hacer pedido 🎉'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Tu pedido</Text>
          {cart.map((item) => (
            <View key={`${item.productId}-${item.variantId ?? 'base'}`} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>{item.name} × {item.quantity}</Text>
              <Text style={styles.summaryPrice}>{item.price ? formatARS(item.price * item.quantity) : '—'}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{count} ítem{count !== 1 ? 's' : ''}</Text>
            <Text style={styles.totalValue}>{formatARS(total)}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, multiline = false, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'email-address' | 'phone-pad';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.slate400}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  steps: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 20 },
  stepItem: { alignItems: 'center', gap: 4, width: 72 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: colors.green500 },
  stepActive: { backgroundColor: colors.primary },
  stepPending: { backgroundColor: colors.slate200 },
  stepNum: { fontWeight: '700', fontSize: 13 },
  stepLabel: { fontSize: 11, fontWeight: '600', color: colors.slate400 },
  stepConnector: { flex: 1, maxWidth: 40, height: 2, backgroundColor: colors.slate200, marginTop: 15 },
  content: { padding: 16, gap: 16, paddingBottom: 60 },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: 20, ...shadow.card },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.slate500, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.3 },
  input: { backgroundColor: colors.slate100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.slate900 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.card, marginTop: 4 },
  nextBtnFlex: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.card },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  rowGap: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate100, paddingVertical: 16, borderRadius: radius.card },
  backBtnText: { color: colors.slate600, fontWeight: '700' },
  addressOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radius.card, borderWidth: 2, marginBottom: 8 },
  addressOptionDefault: { borderColor: colors.slate200, backgroundColor: colors.white },
  addressOptionActive: { borderColor: colors.primary, backgroundColor: '#fff7ed' },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressLabel: { fontWeight: '700', color: colors.slate900, fontSize: 14 },
  addressBadge: { backgroundColor: '#ffedd5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  addressBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primaryDark },
  addressStreet: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  addressSub: { fontSize: 12, color: colors.slate400, marginTop: 1 },
  addressDeleteBtn: { padding: 4 },
  addAddressText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.slate300, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { fontSize: 13, color: colors.slate600 },
  paymentOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: radius.card, borderWidth: 2, marginBottom: 10 },
  paymentOptionDefault: { borderColor: colors.slate200, backgroundColor: colors.white },
  paymentOptionActive: { borderColor: colors.primary, backgroundColor: '#fff7ed' },
  paymentLabel: { fontWeight: '600', color: colors.slate900, fontSize: 14 },
  paymentDesc: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  infoBlock: { backgroundColor: colors.slate50, borderRadius: 14, padding: 14, marginBottom: 12 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: colors.slate400, textTransform: 'uppercase', marginBottom: 6 },
  infoStrong: { fontWeight: '600', color: colors.slate800, fontSize: 14 },
  infoText: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.slate50, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  orderItemName: { flex: 1, fontSize: 13, color: colors.slate700 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200, borderRadius: 999, backgroundColor: colors.white },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 24, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.slate900 },
  orderItemPrice: { fontSize: 13, fontWeight: '700', color: colors.slate900, width: 80, textAlign: 'right' },
  errorText: { backgroundColor: '#fef2f2', color: colors.red500, fontSize: 13, borderRadius: 12, padding: 12 },
  summary: { backgroundColor: colors.white, borderRadius: radius.card, padding: 18, ...shadow.card },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.slate900, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItem: { fontSize: 13, color: colors.slate600, flex: 1, marginRight: 8 },
  summaryPrice: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.slate600 },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.slate800, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.slate500, marginBottom: 20, textAlign: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
