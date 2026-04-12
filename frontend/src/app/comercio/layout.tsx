import ComercioSidebar from "@/components/layout/ComercioSidebar";

export default function ComercioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ComercioSidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
