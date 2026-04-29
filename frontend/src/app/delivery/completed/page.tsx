"use client";

import { useEffect, useState } from "react";
import { Truck, Package, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deliveryApi } from "@/lib/api";

export default function DeliveryCompleted() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryApi.getEarnings()
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">✅ Pedidos Completados</h1>
        <p className="text-slate-300 mt-1">Historial de tus entregas realizadas</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tenés entregas completadas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{order.orderNumber}</h3>
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Entregado
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(order.updatedAt ?? order.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{formatCurrency(order.total)}</p>
                  <p className="text-sm text-slate-400">Comisión: {formatCurrency(order.deliveryCommission ?? order.total * 0.1)}</p>
                  {order.tip > 0 && (
                    <p className="text-sm text-yellow-400">Propina: {formatCurrency(order.tip)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
