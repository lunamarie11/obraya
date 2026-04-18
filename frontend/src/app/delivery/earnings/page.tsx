export default function DeliveryEarnings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Mis Ganancias</h1>
      <p className="text-blue-200">Revisa tus ingresos por entregas.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold text-white mb-2">Hoy</h3>
          <p className="text-2xl font-bold text-green-400">$1,250</p>
          <p className="text-sm text-blue-200">8 entregas</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold text-white mb-2">Esta Semana</h3>
          <p className="text-2xl font-bold text-green-400">$4,650</p>
          <p className="text-sm text-blue-200">24 entregas</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="font-semibold text-white mb-2">Este Mes</h3>
          <p className="text-2xl font-bold text-green-400">$18,500</p>
          <p className="text-sm text-blue-200">95 entregas</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 mt-8">
        <h3 className="font-semibold text-white mb-4">Desglose de Ingresos</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-blue-200">Comisiones (10%)</span>
            <span className="text-white font-medium">$1,650</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">Propinas</span>
            <span className="text-white font-medium">$600</span>
          </div>
          <hr className="border-white/20" />
          <div className="flex justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-green-400 font-bold">$2,250</span>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 mt-8">
        <h3 className="font-semibold text-white mb-4">Próximo Pago</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-200">Fecha de pago</p>
            <p className="text-white font-medium">25/04/2026</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200">Monto a recibir</p>
            <p className="text-green-400 font-bold text-xl">$2,250</p>
          </div>
        </div>
      </div>
    </div>
  );
}