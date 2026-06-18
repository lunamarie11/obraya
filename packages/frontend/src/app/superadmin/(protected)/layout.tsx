import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto bg-slate-950">{children}</main>
    </div>
  );
}
