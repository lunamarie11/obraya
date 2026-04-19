import BuyerSidebar from "@/components/layout/BuyerSidebar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:flex md:flex-row">
      <div className="static md:fixed md:inset-y-0 md:left-0 w-full md:w-64 z-50">
        <BuyerSidebar />
      </div>
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
}