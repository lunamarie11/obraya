"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Truck, Package, DollarSign, Settings, Bell, User, LogOut,
  MapPin, Clock, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth, getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/delivery/dashboard", label: "Dashboard", icon: Truck },
  { href: "/delivery/available", label: "Pedidos disponibles", icon: Package, badge: "5" },
  { href: "/delivery/active", label: "En delivery", icon: MapPin },
  { href: "/delivery/completed", label: "Completados", icon: CheckCircle },
  { href: "/delivery/earnings", label: "Ganancias", icon: DollarSign },
];

export default function DeliverySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = typeof window !== "undefined" ? getCurrentUser() : null;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "DE";

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-white">ObraYa</span>
          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Delivery</div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-200">Disponible</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider px-3 mb-2">
          Gestión
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
                  ? "bg-white/15 text-white border-r-2 border-white"
                  : "text-blue-100 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {"badge" in item && item.badge && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-5 h-5" />
          Configuración
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-red-300 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>

        {/* User */}
        <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 bg-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">{user?.name ?? "Repartidor"}</div>
            <div className="text-[11px] text-blue-200">{user?.email ?? ""}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}