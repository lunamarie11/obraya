"use client";

import { useEffect, useState } from "react";
import { Truck, MapPin, Phone, Package, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ordersApi, deliveryApi } from "@/lib/api";

export default function DeliveryActive() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    // Active = IN_TRANSIT orders assigned to this delivery person
    ordersApi.getAll()
      .then((data) => setOrders(data.filter((o: any) => o.status === "IN_TRANSIT")))
      .catch(() => setError("No se pudieron cargar los pedidos activos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleComplete(orderId: string) {
    setCompleting(orderId);
    try {
      await deliveryApi.completeOrder(orderId, 0);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      // silent
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🚚 En Delivery</h1>
        <p className="text-slate-300 mt-1">Pedidos que estás llevando ahora</p>
      </div>

      {error && (
        <div className="bg-red-900/40 text-red-200 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tenés pedidos activos en este momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">{order.orderNumber} — En camino</h3>
                  {order.user?.name && (
                    <p className="text-sm text-slate-300 mt-0.5">Cliente: {order.user.name}</p>
                  )}
                  {order.address && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-300 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {order.address.street}, {order.address.city}
                    </div>
                  )}
                  {order.user?.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-300 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      {order.user.phone}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xl font-bold text-green-400">{formatCurrency(order.total)}</p>
                  <p className="text-sm text-slate-400">Comisión: {formatCurrency(order.total * 0.1)}</p>
                </div>
              </div>

              {order.items?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-1.5 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Productos
                  </h4>
                  <ul className="space-y-0.5">
                    {order.items.map((item: any, i: number) => (
                      <li key={i} className="text-sm text-slate-300">
                        {item.product?.emoji ?? "📦"} {item.product?.name ?? "Producto"} ×{item.qty}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleComplete(order.id)}
                disabled={completing === order.id}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {completing === order.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                Marcar como entregado
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
