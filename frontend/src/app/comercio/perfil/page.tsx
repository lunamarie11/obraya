"use client";

import { useState, useEffect } from "react";
import {
  Building2, Phone, Mail, CreditCard, CheckCircle2,
  AlertTriangle, Loader2, Save, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usersApi } from "@/lib/api";
import { getCurrentUser, authApi } from "@/lib/auth";

// ── CUIT validation (algoritmo AFIP) ───────────────────────────────────────
function formatCuit(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

function validateCuit(cuit: string): { valid: boolean; message: string } {
  const digits = cuit.replace(/\D/g, "");
  if (digits.length !== 11) return { valid: false, message: "El CUIT debe tener 11 dígitos" };

  const prefix = parseInt(digits.slice(0, 2), 10);
  const validPrefixes = [20, 23, 24, 27, 30, 33, 34];
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, message: "Prefijo de CUIT inválido (debe empezar con 20, 27, 30, 33…)" };
  }

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * parseInt(digits[i], 10), 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  if (checkDigit === 10) return { valid: false, message: "CUIT inválido (dígito verificador incorrecto)" };
  if (checkDigit !== parseInt(digits[10], 10)) {
    return { valid: false, message: "CUIT inválido (dígito verificador no coincide)" };
  }

  return { valid: true, message: "CUIT válido ✓" };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ComercioPerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cuit, setCuit] = useState("");

  const cuitValidation = cuit.replace(/\D/g, "").length === 11 ? validateCuit(cuit) : null;
  const profileComplete = !!name.trim() && !!phone.trim() && cuitValidation?.valid;

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) { setLoading(false); return; }
    usersApi.getOne(current.id)
      .then((u) => {
        setUser(u);
        setName(u.name ?? "");
        setPhone(u.phone ?? "");
        setCuit(u.cuit ? formatCuit(u.cuit) : "");
      })
      .catch(() => setError("No se pudo cargar tu perfil"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!user) return;
    if (!name.trim()) { setError("La razón social es obligatoria"); return; }
    if (cuit && !cuitValidation?.valid) { setError("El CUIT ingresado no es válido"); return; }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await usersApi.update(user.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        cuit: cuit.replace(/\D/g, "") || undefined,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">🏢 Perfil de empresa</h1>
          <p className="text-sm text-gray-500 mt-1">Datos de tu comercio en la plataforma ObraYa</p>
        </div>
        {/* Completion badge */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold",
          profileComplete ? "bg-success-50 text-success-500" : "bg-warning-50 text-warning-600"
        )}>
          {profileComplete
            ? <><CheckCircle2 className="w-4 h-4" /> Perfil completo</>
            : <><AlertTriangle className="w-4 h-4" /> Perfil incompleto</>
          }
        </div>
      </div>

      {/* Incomplete profile alert */}
      {!profileComplete && (
        <div className="mb-6 bg-warning-50 border border-warning-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
          <div className="text-sm text-warning-700">
            <p className="font-semibold mb-1">Completá tu perfil para operar en el marketplace</p>
            <ul className="space-y-0.5 text-warning-600">
              {!name.trim() && <li>• Razón social obligatoria</li>}
              {!phone.trim() && <li>• Teléfono de contacto</li>}
              {!cuitValidation?.valid && <li>• CUIT válido (requerido para facturar)</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card p-6 space-y-6">

        {/* Razón Social */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Razón Social *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Loma Negra S.A."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Nombre legal con el que aparecerás en el marketplace</p>
        </div>

        {/* CUIT */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            CUIT *
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={cuit}
              onChange={(e) => setCuit(formatCuit(e.target.value))}
              placeholder="30-71234567-9"
              maxLength={13}
              className={cn(
                "w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all font-mono",
                cuitValidation === null
                  ? "border-gray-200 focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  : cuitValidation.valid
                    ? "border-success-400 focus:ring-2 focus:ring-success-400 bg-success-50/30"
                    : "border-danger-400 focus:ring-2 focus:ring-danger-400 bg-danger-50/30"
              )}
            />
          </div>
          {cuitValidation && (
            <p className={cn(
              "text-xs mt-1 font-medium flex items-center gap-1",
              cuitValidation.valid ? "text-success-500" : "text-danger-500"
            )}>
              {cuitValidation.valid
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <AlertTriangle className="w-3.5 h-3.5" />
              }
              {cuitValidation.message}
            </p>
          )}
          {!cuitValidation && (
            <p className="text-xs text-gray-400 mt-1">Formato: XX-XXXXXXXX-X · Requerido para emitir facturas AFIP</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Teléfono de contacto
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 4123-4567"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={user?.email ?? ""}
              readOnly
              className="w-full border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">El email no se puede modificar desde aquí</p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="bg-success-50 text-success-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Perfil guardado correctamente
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Info box */}
      <div className="mt-6 bg-navy-50 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-navy-500 shrink-0 mt-0.5" />
        <div className="text-sm text-navy-700">
          <p className="font-semibold mb-1">¿Por qué necesitamos el CUIT?</p>
          <p className="text-navy-600">ObraYa integra con AFIP para emitir facturas A y B automáticamente cuando se confirma un pedido. Sin CUIT válido no podrás recibir pagos ni emitir comprobantes fiscales.</p>
        </div>
      </div>
    </div>
  );
}
