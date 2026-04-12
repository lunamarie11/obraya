import ArquitectoSidebar from "@/components/layout/ArquitectoSidebar";

export default function ArquitectoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ArquitectoSidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
