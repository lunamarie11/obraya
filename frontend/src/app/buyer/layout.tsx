import BuyerSidebar from "@/components/layout/BuyerSidebar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <BuyerSidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}