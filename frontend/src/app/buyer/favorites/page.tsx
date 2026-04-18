export default function BuyerFavorites() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Favoritos</h1>
      <p className="text-gray-600">Tus productos favoritos para compras rápidas.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">Cemento Portland</h3>
              <p className="text-sm text-gray-600">Bolsa de 50kg</p>
            </div>
            <button className="text-red-500 hover:text-red-700">
              ❤️
            </button>
          </div>
          <p className="text-lg font-bold text-green-600 mb-4">$2,500</p>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
            Agregar al carrito
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">Arena Fina</h3>
              <p className="text-sm text-gray-600">Metro cúbico</p>
            </div>
            <button className="text-red-500 hover:text-red-700">
              ❤️
            </button>
          </div>
          <p className="text-lg font-bold text-green-600 mb-4">$8,000</p>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}