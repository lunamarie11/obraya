"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShoppingCart, Package, Truck, LogOut } from "lucide-react";
import { clearAuth, getCurrentUser, Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const roleOptions: Array<{ role: Role; label: string; href: string; icon: any; accent: string }> = [
  { role: "ARQUITECTO", label: "Arquitecto", href: "/arquitecto/dashboard", icon: Building2, accent: "from-navy-600 to-navy-800" },
  { role: "COMERCIO", label: "Comercio", href: "/comercio/dashboard", icon: ShoppingCart, accent: "from-brand-500 to-brand-700" },
  { role: "BUYER", label: "Buyer", href: "/buyer/dashboard", icon: Package, accent: "from-emerald-500 to-emerald-700" },
  { role: "DELIVERY", label: "Delivery", href: "/delivery/dashboard", icon: Truck, accent: "from-sky-500 to-sky-700" },
];

function roleLabel(role: Role | null) {
  switch (role) {
    case "ARQUITECTO":
      return "Arquitecto";
    case "COMERCIO":
      return "Comercio";
    case "BUYER":
      return "Buyer";
    case "DELIVERY":
      return "Delivery";
    default:
      return "Sin rol";
  }
}

export default function RoleSwitcher() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setUser(getCurrentUser());
  }, []);

  const currentRole = user?.role ?? null;

  function handleSwitchRole() {
    clearAuth();
    router.push("/");
  }

  return (
    <div className="px-4 py-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Roles</p>
          <p className="text-sm font-semibold text-gray-900">Rol actual: {hydrated ? roleLabel(currentRole) : "Cargando..."}</p>
        </div>
        <Link href="/roles" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition">
          Ver todos
        </Link>
      </div>

      <div className="grid gap-2">
        {roleOptions.map((item) => {
          const Icon = item.icon;
          const isActive = currentRole === item.role;
          return (
            <Link
              key={item.role}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition",
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-brand-500 hover:text-gray-900"
              )}
            >
              <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white", item.accent)}>
                <Icon className="w-4 h-4" />
              </span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-brand-500">Activo</span>}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSwitchRole}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        <LogOut className="w-4 h-4" />
        Cambiar de rol
      </button>
    </div>
  );
}
