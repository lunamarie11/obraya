export default function BuyerMarketplace() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <p className="text-gray-600">Busca y compra materiales de construcción.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Product cards placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Cemento Portland</h3>
          <p className="text-sm text-gray-600 mb-4">Bolsa de 50kg</p>
          <p className="text-lg font-bold text-green-600">$2,500</p>
          <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
            Agregar al carrito
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Arena Fina</h3>
          <p className="text-sm text-gray-600 mb-4">Metro cúbico</p>
          <p className="text-lg font-bold text-green-600">$8,000</p>
          <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
            Agregar al carrito
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Hierro Corrugado</h3>
          <p className="text-sm text-gray-600 mb-4">6mm x 12m</p>
          <p className="text-lg font-bold text-green-600">$15,000</p>
          <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}