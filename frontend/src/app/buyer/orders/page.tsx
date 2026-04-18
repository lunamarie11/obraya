export default function BuyerOrders() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>
      <p className="text-gray-600">Historial y estado de tus compras.</p>

      <div className="space-y-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">Pedido #001</h3>
              <p className="text-sm text-gray-600">2 items • $10,500</p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              En tránsito
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Repartidor: Pedro Rodríguez • Moto ABC 123
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">Pedido #002</h3>
              <p className="text-sm text-gray-600">1 item • $2,500</p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Entregado
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Entregado el 15/04/2026
          </div>
        </div>
      </div>
    </div>
  );
}