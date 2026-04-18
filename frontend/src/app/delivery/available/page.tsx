export default function DeliveryAvailable() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Pedidos Disponibles</h1>
      <p className="text-blue-200">Acepta pedidos para entrega inmediata.</p>

      <div className="space-y-4 mt-8">
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-white">Pedido #001</h3>
              <p className="text-sm text-blue-200">Cliente: María González</p>
              <p className="text-sm text-blue-200">Dirección: Av. Corrientes 1234, CABA</p>
              <p className="text-sm text-blue-200">Distancia: 2.5 km</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">$2,500</p>
              <p className="text-sm text-blue-200">Comisión: $250</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              Aceptar Pedido
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              Ver Detalles
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-white">Pedido #002</h3>
              <p className="text-sm text-blue-200">Cliente: Juan Pérez</p>
              <p className="text-sm text-blue-200">Dirección: Calle Florida 567, CABA</p>
              <p className="text-sm text-blue-200">Distancia: 1.8 km</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">$8,000</p>
              <p className="text-sm text-blue-200">Comisión: $800</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              Aceptar Pedido
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}