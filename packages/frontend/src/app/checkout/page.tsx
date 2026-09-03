'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, formatARS } from '@/lib/api';
import { clearCart, updateCartItemQuantity, getCartGroupedByCompany } from '@/lib/cart';
import { getStoredBuyer } from '@/lib/buyer-auth';
import { getBuyerAddresses, createBuyerAddress, deleteBuyerAddress, type BuyerAddress } from '@/lib/addresses';
import { useCart } from '@/hooks/useCart';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { MapPin, Package, CheckCircle2, ArrowRight, Minus, Plus, Wallet, Landmark, LogIn, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

const STEPS = ['Dirección', 'Método de pago', 'Resumen'] as const;
type Step = 0 | 1 | 2;
type PaymentMethod = 'efectivo' | 'transferencia';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo / contra-entrega', desc: 'Pagás cuando lo recibís en tu obra.', icon: Wallet },
  { value: 'transferencia', label: 'Transferencia bancaria', desc: 'Te compartimos los datos por chat con el vendedor.', icon: Landmark },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, total, count } = useCart();
  const [step, setStep] = React.useState<Step>(0);

  const buyer = React.useMemo(() => getStoredBuyer(), []);
  const [buyerName, setBuyerName] = React.useState(() =>
    buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : '',
  );
  const [buyerEmail, setBuyerEmail] = React.useState(() => buyer?.email ?? '');
  const [buyerPhone, setBuyerPhone] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [address, setAddress] = React.useState({ street: '', city: '', province: '', postalCode: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('efectivo');

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
    onSuccess: (_data, id) => {
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
      const groups = getCartGroupedByCompany();
      const orders = await Promise.all(
        groups.map((group) =>
          api.post('/buyer-orders', {
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
            buyerName, buyerEmail, buyerPhone,
            // Payments sigue stub en el backend (ver ADR-003): el método elegido viaja
            // como nota legible para el vendedor, no como un campo de pago real.
            notes: `Método de pago: ${paymentMethod === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo / contra-entrega'}.${notes ? ` ${notes}` : ''}`,
            deliveryAddress: address,
          }).then((r) => r.data),
        ),
      );
      return orders;
    },
    onSuccess: (orders) => {
      clearCart();
      const orderIds = orders.map((o: any) => o.id).join(',');
      router.push(`/order-confirmation?orderIds=${orderIds}`);
    },
  });

  if (!buyer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MarketplaceHeader showSearch={false} showBack backHref="/cart" title="Checkout" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <LogIn size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ingresá para continuar</h2>
          <p className="text-slate-500 mb-6">Necesitás una cuenta para hacer el pedido y hacerle seguimiento.</p>
          <Link href="/account" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios">
            Ingresar <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MarketplaceHeader showSearch={false} showBack backHref="/cart" title="Checkout" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <span className="text-6xl">🛒</span>
          <h2 className="text-xl font-bold text-slate-800 mt-4 mb-2">No hay productos</h2>
          <p className="text-slate-500 mb-6">Agregá materiales antes de continuar.</p>
          <a href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios">
            Ir al marketplace
          </a>
        </div>
      </div>
    );
  }

  const canGoStep1 = buyerName.trim() && buyerEmail.trim() && address.street.trim() && address.city.trim();

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketplaceHeader showSearch={false} showBack backHref="/cart" title="Checkout" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400',
                )}>
                  {i < step ? <CheckCircle2 size={18} /> : i + 1}
                </div>
                <span className={clsx('text-xs font-semibold', i === step ? 'text-orange-500' : 'text-slate-400')}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-3 mb-5 transition-colors', i < step ? 'bg-green-500' : 'bg-slate-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left form */}
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="card-ios p-6 space-y-4">
                <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" /> Dirección de entrega
                </h2>
                <Field label="Nombre completo *" value={buyerName} onChange={setBuyerName} placeholder="Juan García" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email *" type="email" value={buyerEmail} onChange={setBuyerEmail} placeholder="juan@email.com" />
                  <Field label="Teléfono" type="tel" value={buyerPhone} onChange={setBuyerPhone} placeholder="+54 11 1234-5678" />
                </div>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Tus direcciones guardadas
                    </label>
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => selectSavedAddress(addr)}
                        className={clsx(
                          'w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all btn-ios',
                          !useManualForm && selectedAddressId === addr.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50',
                        )}
                      >
                        <MapPin size={18} className={!useManualForm && selectedAddressId === addr.id ? 'text-orange-500 shrink-0 mt-0.5' : 'text-slate-400 shrink-0 mt-0.5'} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">Predeterminada</span>
                            )}
                          </span>
                          <span className="block text-sm text-slate-500 truncate">{addr.street}</span>
                          <span className="block text-xs text-slate-400 truncate">
                            {[addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
                          </span>
                        </span>
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAddressMutation.mutate(addr.id);
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </span>
                      </button>
                    ))}
                    {!showAddressForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors py-1"
                      >
                        + Agregar nueva dirección
                      </button>
                    )}
                  </div>
                )}

                {useManualForm && (
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Nueva dirección
                      </label>
                    )}
                    <Field label="Calle y número *" value={address.street} onChange={(v) => setAddress({ ...address, street: v })} placeholder="Av. Corrientes 1234" />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ciudad *" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} placeholder="Buenos Aires" />
                      <Field label="Provincia" value={address.province} onChange={(v) => setAddress({ ...address, province: v })} placeholder="CABA" />
                    </div>
                    <Field label="Código postal" value={address.postalCode} onChange={(v) => setAddress({ ...address, postalCode: v })} placeholder="C1043" />
                    <Field label="Piso / Depto / Referencias" value={address.notes} onChange={(v) => setAddress({ ...address, notes: v })} placeholder="2° B, timbre García" />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                      Guardar esta dirección para la próxima
                    </label>
                  </div>
                )}

                <Field label="Notas del pedido" value={notes} onChange={setNotes} placeholder="Instrucciones especiales..." multiline />
                <button
                  disabled={!canGoStep1 || createAddressMutation.isPending}
                  onClick={handleContinueFromAddress}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-ios mt-2"
                >
                  {createAddressMutation.isPending ? 'Guardando...' : <>Siguiente <ArrowRight size={18} /></>}
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="card-ios p-6 space-y-4">
                <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Wallet size={18} className="text-orange-500" /> Método de pago
                </h2>
                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPaymentMethod(opt.value)}
                        className={clsx(
                          'w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all btn-ios',
                          paymentMethod === opt.value ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                        )}
                      >
                        <Icon size={20} className={paymentMethod === opt.value ? 'text-orange-500' : 'text-slate-400'} />
                        <span>
                          <span className="block font-semibold text-slate-900">{opt.label}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(0)} className="flex-1 py-4 rounded-2xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors btn-ios">
                    Atrás
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors btn-ios"
                  >
                    Siguiente <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card-ios p-6 space-y-5">
                <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-orange-500" /> Confirmá tu pedido
                </h2>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comprador</p>
                  <p className="font-semibold text-slate-800">{buyerName}</p>
                  <p className="text-sm text-slate-500">{buyerEmail}</p>
                  {buyerPhone && <p className="text-sm text-slate-500">{buyerPhone}</p>}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Entrega en</p>
                  <p className="font-semibold text-slate-800">{address.street}</p>
                  <p className="text-sm text-slate-500">{[address.city, address.province, address.postalCode].filter(Boolean).join(', ')}</p>
                  {address.notes && <p className="text-sm text-slate-400 mt-1">{address.notes}</p>}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pago</p>
                  <p className="font-semibold text-slate-800">
                    {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tu pedido (editable)</p>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-slate-700 line-clamp-1 flex-1">{item.name}</span>
                        <div className="flex items-center rounded-full border border-slate-200 bg-white overflow-hidden shrink-0">
                          <button
                            onClick={() => updateCartItemQuantity(item.productId, item.variantId ?? null, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.productId, item.variantId ?? null, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-slate-900 shrink-0 w-20 text-right">
                          {item.price ? formatARS(item.price * item.quantity) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {createOrder.isError && (
                  <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
                    Error al procesar el pedido. Verificá los datos e intentá de nuevo.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors btn-ios">
                    Atrás
                  </button>
                  <button
                    disabled={createOrder.isPending || cart.length === 0}
                    onClick={() => createOrder.mutate()}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors btn-ios shadow-sm"
                  >
                    {createOrder.isPending ? 'Procesando...' : 'Hacer pedido 🎉'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sticky */}
          <div className="lg:col-span-1">
            <div className="card-ios p-5 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4">Tu pedido</h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate mr-2 line-clamp-1">{item.name} × {item.quantity}</span>
                    <span className="font-semibold text-slate-800 shrink-0">
                      {item.price ? formatARS(item.price * item.quantity) : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">{count} ítem{count !== 1 ? 's' : ''}</span>
                  <span className="text-xl font-extrabold text-slate-900">{formatARS(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const base = 'w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}
