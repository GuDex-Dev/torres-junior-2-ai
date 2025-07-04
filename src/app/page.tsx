import Chatbot from '@/components/Chatbot';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50 border-b border-orange-100">
        <nav className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold">TJ2</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Torres Jr. 2
                </h1>
                <p className="text-xs text-amber-600">
                  Ropa para toda la familia
                </p>
              </div>
            </div>

            <div className="hidden md:flex space-x-6">
              <a
                href="#hero"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                Inicio
              </a>
              <a
                href="#productos"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                Productos
              </a>
              <a
                href="#chatbot"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                Asistente
              </a>
              <a
                href="#contacto"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="pt-20 min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center"
      >
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Ropa de calidad para
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  {' '}
                  toda la familia
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                En Torres Jr. 2 encontrarás la mejor selección de ropa para
                bebés, niños, niñas y mujeres. Calidad, estilo y comodidad en
                cada prenda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#chatbot"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg text-center"
                >
                  🤖 Consultar Asistente Virtual
                </a>
                <a
                  href="#productos"
                  className="border-2 border-amber-500 text-amber-600 px-8 py-4 rounded-xl font-semibold hover:bg-amber-500 hover:text-white transition-all duration-200 text-center"
                >
                  Ver Productos
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl">👗👶👔</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Section */}
      <section id="productos" className="py-20 pt-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Productos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra amplia variedad de prendas para cada momento y
              ocasión
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                titulo: 'Ropa de Bebé',
                emoji: '👶',
                descripcion: 'Ajuares, overoles, bodys',
              },
              {
                titulo: 'Ropa de Niño',
                emoji: '👦',
                descripcion: 'Polos, pantalones, conjuntos',
              },
              {
                titulo: 'Ropa de Niña',
                emoji: '👧',
                descripcion: 'Vestidos, blusas, faldas',
              },
              {
                titulo: 'Ropa de Mujer',
                emoji: '👩',
                descripcion: 'Blusas, pantalones, vestidos',
              },
              {
                titulo: 'Accesorios',
                emoji: '👜',
                descripcion: 'Bolsos, mochilas, carteras',
              },
              {
                titulo: 'Maternidad',
                emoji: '🤱',
                descripcion: 'Ropa de lactancia y maternidad',
              },
              {
                titulo: 'Calzado Infantil',
                emoji: '👟',
                descripcion: 'Zapatos para bebés y niños',
              },
              {
                titulo: 'Medias',
                emoji: '🧦',
                descripcion: 'Algodón y perlón para niños',
              },
            ].map((categoria, i) => (
              <div key={i} className="group">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl text-center hover:shadow-lg transition-all duration-200 border border-orange-100 group-hover:border-amber-300">
                  <div className="text-4xl mb-4">{categoria.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {categoria.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {categoria.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="#chatbot"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg inline-block"
            >
              Consultar Stock y Precios 💬
            </a>
          </div>
        </div>
      </section>

      {/* Chatbot Section */}
      <Chatbot />

      {/* Contacto Section */}
      <section id="contacto" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Visítanos
            </h2>
            <p className="text-xl text-gray-600">
              Te esperamos en nuestra tienda en Sullana, Piura
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📍 Ubicación
                </h3>
                <p className="text-gray-600">
                  <strong>Calle Grau #739</strong>
                  <br />
                  Sullana, Piura, Perú
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ⏰ Horarios
                </h3>
                <p className="text-gray-600">
                  <strong>Lunes a Domingo</strong>
                  <br />
                  9:00 AM - 9:00 PM
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  💳 Métodos de Pago
                </h3>
                <div className="text-gray-600 space-y-1">
                  <p>• Efectivo</p>
                  <p>• Tarjeta de débito/crédito</p>
                  <p>• Yape y Plin</p>
                  <p>• Transferencias bancarias</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ℹ️ Información Adicional
                </h3>
                <div className="text-gray-600 space-y-2">
                  <p>
                    <strong>RUC:</strong> 10404099685
                  </p>
                  <p>
                    <strong>Cambios:</strong> Con boleta y producto intacto
                  </p>
                  <p>
                    <strong>Precios por mayor:</strong> Disponibles
                  </p>
                  <p>
                    <strong>Mercadería nueva:</strong> Llega mensualmente
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl text-white">
                <h3 className="text-xl font-semibold mb-4">
                  ¿Tienes preguntas?
                </h3>
                <p className="mb-4">
                  Nuestro asistente virtual está disponible las 24 horas para
                  ayudarte con consultas sobre productos, tallas, colores y
                  stock.
                </p>
                <a
                  href="#chatbot"
                  className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                >
                  Preguntar al Asistente 🤖
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TJ2</span>
            </div>
            <span className="text-xl font-semibold">Torres Jr. 2</span>
          </div>
          <p className="text-gray-400">
            © 2025 Torres Jr. 2 - Ropa de calidad para toda la familia
          </p>
        </div>
      </footer>
    </main>
  );
}
