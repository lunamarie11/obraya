"use client";

import { Heart } from "lucide-react";

export default function BuyerFavorites() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
          <Heart className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Favoritos</h1>
        <p className="mt-3 text-sm text-slate-500">
          Guardá productos para comprarlos más rápido. Esta función estará disponible en la próxima versión.
        </p>
        <a
          href="/buyer/marketplace"
          className="mt-6 inline-block rounded-2xl bg-brand-600 text-white text-sm font-semibold px-6 py-3 hover:bg-brand-700 transition-colors"
        >
          Ir al Marketplace
        </a>
      </div>
    </div>
  );
}
