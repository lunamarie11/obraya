"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ShoppingCart, Package, Truck, Heart, Settings,
  Bell, User, LogOut, Search, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth, getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/buyer/dashboard", label: "Inicio", icon: Home },
  { href: "/buyer/marketplace", label: "Comprar", icon: ShoppingCart },
  { href: "/buyer/orders", label: "Mis pedidos", icon: Package, badge: "2" },
  { href: "/buyer/tracking", label: "Seguimiento", icon: Truck },
  { href: "/buyer/favorites", label: "Favoritos", icon: Heart },
];

export default function BuyerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = typeof window !== "undefined" ? getCurrentUser() : null;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "BU";

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-200">
        <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">ObraYa</span>
          <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Comprador</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
          Menú
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
                  ? "bg-brand-50 text-brand-600 border-r-2 border-brand-500"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1 border-t border-gray-200 pt-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <Settings className="w-5 h-5" />
          Configuración
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <MapPin className="w-5 h-5" />
          Direcciones
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>

        {/* User */}
        <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-brand-500 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-gray-900">{user?.name ?? "Comprador"}</div>
            <div className="text-[11px] text-gray-500">{user?.email ?? ""}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}