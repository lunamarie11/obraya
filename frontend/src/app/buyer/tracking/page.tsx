export default function BuyerTracking() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Seguimiento de Pedidos</h1>
      <p className="text-gray-600">Rastrea tus entregas en tiempo real.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border mt-8">
        <h3 className="font-semibold mb-4">Pedido #001 - En tránsito</h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium">Pedido confirmado</p>
              <p className="text-sm text-gray-600">17/04/2026 10:00</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium">Preparando pedido</p>
              <p className="text-sm text-gray-600">17/04/2026 11:30</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">→</span>
            </div>
            <div>
              <p className="font-medium">En camino</p>
              <p className="text-sm text-gray-600">Repartidor: Pedro Rodríguez</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">○</span>
            </div>
            <div>
              <p className="font-medium text-gray-600">Entregado</p>
              <p className="text-sm text-gray-600">Pendiente</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Repartidor:</strong> Pedro Rodríguez<br/>
            <strong>Vehículo:</strong> Moto ABC 123<br/>
            <strong>Teléfono:</strong> +54 11 2345 6789<br/>
            <strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.8)
          </p>
        </div>
      </div>
    </div>
  );
}