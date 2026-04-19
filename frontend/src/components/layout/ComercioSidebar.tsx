"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Boxes, Package, Truck,
  Settings, HardHat, Bell, ArrowLeft, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RoleSwitcher from "@/components/layout/RoleSwitcher";

const navItems = [
  { href: "/comercio/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/comercio/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/comercio/productos", label: "Productos", icon: Boxes, badge: "3" },
  { href: "/comercio/pedidos", label: "Mis Pedidos", icon: Package },
  { href: "/comercio/logistica", label: "Logística", icon: Truck, badge: "2" },
];

export default function ComercioSidebar() {
  const pathname = usePathname();

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

      {/* Back to role selector */}
      <div className="px-4 mb-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cambiar de rol
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
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
              {"badge" in item && item.badge && (
                <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <RoleSwitcher />

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
          <span className="ml-auto bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            5
          </span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-5 h-5" />
          Configuración
        </Link>

        {/* User */}
        <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-brand-500">
            LN
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Loma Negra S.A.</div>
            <div className="text-[11px] text-gray-500">Comercio</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
