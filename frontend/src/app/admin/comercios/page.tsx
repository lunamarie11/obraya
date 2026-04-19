"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, MapPin } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Comercio {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cidade?: string;
  createdAt: string;
}

export default function AdminComercios() {
  const [search, setSearch] = useState("");
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAllComercios({ limit: 100, offset: 0 })
      .then((data) => {
        setComercios(data.comercios || []);
      })
      .catch((err) => {
        console.error("Error fetching comercios:", err);
        setComercios([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = comercios.filter((comercio) =>
    comercio.name.toLowerCase().includes(search.toLowerCase()) ||
    comercio.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando comercios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Comercios</h1>
              <p className="mt-1 text-sm text-slate-500">Administra los comercios y proveedores de la plataforma.</p>
            </div>
            <button className="rounded-3xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition">
              + Crear Comercio
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Comercios</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{comercios.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Activos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{comercios.length}</p>
            </div>
          </div>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comercio..."
            className="w-full border border-gray-200 rounded-2xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Comercio</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Contacto</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Localización</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Fecha Registro</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comercio) => (
                <tr key={comercio.id} className="border-b border-gray-200 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{comercio.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div>{comercio.email}</div>
                      {comercio.phone && <div>{comercio.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3" />
                      <span>{comercio.cidade || "No especificado"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(comercio.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No se encontraron comercios.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
