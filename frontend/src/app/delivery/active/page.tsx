export default function DeliveryActive() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">En Delivery</h1>
      <p className="text-blue-200">Gestiona tus entregas activas.</p>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 mt-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-white">Pedido #001 - En camino</h3>
            <p className="text-sm text-blue-200">Cliente: María González</p>
            <p className="text-sm text-blue-200">Dirección: Av. Corrientes 1234, CABA</p>
            <p className="text-sm text-blue-200">Teléfono: +54 11 3456 7890</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">$2,500</p>
            <p className="text-sm text-blue-200">Comisión: $250</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-white mb-2">Productos:</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Cemento Portland x1</li>
            <li>• Arena Fina x0.5 m³</li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
            Marcar como Entregado
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            Llamar Cliente
          </button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
            Ver en Mapa
          </button>
        </div>
      </div>
    </div>
  );
}