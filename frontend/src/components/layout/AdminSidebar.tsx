"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Store, Users, Truck, BarChart3, Settings,
  Bell, LogOut, Archive, TrendingUp, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth, getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/admin/dashboard", label: "Panel Principal", icon: LayoutDashboard },
  { href: "/admin/comercios", label: "Comercios", icon: Store, badge: "15" },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, badge: "156" },
  { href: "/admin/ordenes", label: "Órdenes", icon: Archive, badge: "48" },
  { href: "/admin/entregas", label: "Entregas", icon: Truck, badge: "12" },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/metricas", label: "Métricas", icon: TrendingUp },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser> | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD";

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 text-white">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-bold">
          ⚙️
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-white">ObraYa</span>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Super Admin</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-4">
          Administración
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-500/20 text-amber-400 border-r-2 border-amber-500"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {"badge" in item && item.badge && (
                <span className="ml-auto bg-amber-500/30 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1 border-t border-slate-800 pt-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
          <span className="ml-auto bg-red-500/30 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Settings className="w-5 h-5" />
          Configuración
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>

        {/* User */}
        <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-800">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 bg-amber-400 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">{user?.name ?? "Admin"}</div>
            <div className="text-[11px] text-slate-400">{user?.email ?? ""}</div>
          </div>
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
