"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  DollarSign,
  ShoppingCart,
  Calculator,
  Package,
  Settings,
  HardHat,
  Plus,
  Bell,
  Boxes,
  Truck,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/tareas", label: "Tareas", icon: ListTodo, badge: "4" },
  { href: "/presupuesto", label: "Presupuesto", icon: DollarSign },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Boxes, badge: "3" },
  { href: "/logistica", label: "Logística", icon: Truck, badge: "2" },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/seguimiento", label: "Mis Pedidos", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-brand-500">
          ObraYa
        </span>
      </div>

      {/* New Project Button */}
      <div className="px-4 mb-4">
        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Obra
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-5 h-5" />
          Notificaciones
          <span className="ml-auto bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            3
          </span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-5 h-5" />
          Configuracion
        </Link>

        {/* User */}
        <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
              currentUser.avatar_color
            )}
          >
            {currentUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-gray-500">
              Dueno de obra
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
