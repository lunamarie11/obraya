import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
