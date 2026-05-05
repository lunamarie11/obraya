"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Boxes, Package, Truck,
  Settings, Bell, ArrowLeft, Store, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import RoleSwitcher from "@/components/layout/RoleSwitcher";

const navItems = [
  { href: "/comercio/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/comercio/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/comercio/productos",   label: "Productos",   icon: Boxes },
  { href: "/comercio/pedidos",     label: "Mis Pedidos", icon: Package },
  { href: "/comercio/logistica",   label: "Logística",   icon: Truck },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ComercioSidebar() {
  const pathname = usePathname();
  const session = getCurrentUser();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!session?.id) return;
    usersApi.getOne(session.id).then(setProfile).catch(() => {});
  }, [session?.id]);

  const user = profile ?? session;
  const profileIncomplete = profile && !profile.cuit;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-brand-500">ObraYa</span>
          <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Comercio</div>
        </div>
      </div>

      {/* Back */}
      <div className="px-4 mb-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cambiar de rol
        </Link>
      </div>

      {/* Perfil incompleto banner */}
      {profileIncomplete && (
        <Link href="/comercio/perfil" className="mx-3 mb-3">
          <div className="bg-warning-500/15 border border-warning-500/30 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-warning-500/20 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5 text-warning-400 shrink-0" />
            <span className="text-[11px] text-warning-300 font-semibold">Completá tu perfil →</span>
          </div>
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
          Gestión Comercial
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1",
                isActive
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <RoleSwitcher />

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
        </Link>
        <Link
          href="/comercio/perfil"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            pathname.startsWith("/comercio/perfil")
              ? "bg-brand-500/15 text-brand-400"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings className="w-5 h-5" />
          Mi empresa
          {profileIncomplete && (
            <span className="ml-auto w-2 h-2 rounded-full bg-warning-400" />
          )}
        </Link>

        {/* User card */}
        <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-brand-500 shrink-0">
            {user?.name ? initials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user?.name ?? "Mi empresa"}</div>
            <div className="text-[11px] text-gray-500">
              {user?.cuit ? `CUIT ${user.cuit.replace(/(\d{2})(\d{8})(\d)/, "$1-$2-$3")}` : "CUIT no cargado"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
