import DeliverySidebar from "@/components/layout/DeliverySidebar";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DeliverySidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}