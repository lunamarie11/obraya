export default function DeliveryCompleted() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Pedidos Completados</h1>
      <p className="text-blue-200">Historial de entregas realizadas.</p>

      <div className="space-y-4 mt-8">
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-white">Pedido #001</h3>
              <p className="text-sm text-blue-200">Cliente: María González</p>
              <p className="text-sm text-blue-200">Entregado: 17/04/2026 14:30</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">$2,500</p>
              <p className="text-sm text-blue-200">Comisión: $250</p>
              <p className="text-sm text-green-300">Propina: $100</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Entregado ✓
            </span>
            <span className="text-sm text-blue-200">Rating: ⭐⭐⭐⭐⭐</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-white">Pedido #002</h3>
              <p className="text-sm text-blue-200">Cliente: Juan Pérez</p>
              <p className="text-sm text-blue-200">Entregado: 16/04/2026 16:45</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">$8,000</p>
              <p className="text-sm text-blue-200">Comisión: $800</p>
              <p className="text-sm text-green-300">Propina: $200</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Entregado ✓
            </span>
            <span className="text-sm text-blue-200">Rating: ⭐⭐⭐⭐⭐</span>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 mt-8">
        <h3 className="font-semibold text-white mb-4">Resumen de la Semana</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-200">Total Entregas</p>
            <p className="text-2xl font-bold text-white">24</p>
          </div>
          <div>
            <p className="text-sm text-blue-200">Ganancias Totales</p>
            <p className="text-2xl font-bold text-green-400">$4,650</p>
          </div>
        </div>
      </div>
    </div>
  );
}