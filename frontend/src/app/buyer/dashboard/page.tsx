export default function BuyerDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Comprador</h1>
      <p className="text-gray-600">Bienvenido a tu panel de compras. Aquí podrás encontrar materiales de construcción y hacer seguimiento de tus pedidos.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Pedidos Activos</h3>
          <p className="text-2xl font-bold text-blue-600">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Favoritos</h3>
          <p className="text-2xl font-bold text-green-600">15</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Total Gastado</h3>
          <p className="text-2xl font-bold text-purple-600">$45,230</p>
        </div>
      </div>
    </div>
  );
}