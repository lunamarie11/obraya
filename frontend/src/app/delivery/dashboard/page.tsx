export default function DeliveryDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Delivery</h1>
      <p className="text-gray-100">Panel de control para repartidores. Gestiona tus entregas y ganancias.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold mb-2 text-white">Pedidos Disponibles</h3>
          <p className="text-2xl font-bold text-yellow-400">5</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold mb-2 text-white">En Delivery</h3>
          <p className="text-2xl font-bold text-blue-400">1</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold mb-2 text-white">Ganancias Hoy</h3>
          <p className="text-2xl font-bold text-green-400">$1,250</p>
        </div>
      </div>

      <div className="mt-8 bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
        <h3 className="font-semibold mb-4 text-white">Comisiones y Propinas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-200">Comisión por pedido</p>
            <p className="text-lg font-bold text-white">10%</p>
          </div>
          <div>
            <p className="text-sm text-blue-200">Propina promedio</p>
            <p className="text-lg font-bold text-white">$50</p>
          </div>
        </div>
      </div>
    </div>
  );
}