"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    const isAdminUser = user?.email === "admin@obraya.com" || user?.role === "ADMIN";
    
    if (isAdminUser) {
      setIsAdmin(true);
    } else {
      // Redirect non-admin users
      setIsAdmin(false);
      router.push("/login");
    }
  }, []); // Empty dependency array - only run once on mount

  // Show loading while checking permissions
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Return null while redirecting non-admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 w-full">{children}</main>
    </div>
  );
}
