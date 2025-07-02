// app/admin/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">TJ2</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Torres Jr. 2</h1>
                  <p className="text-xs text-amber-600">Panel Admin</p>
                </div>
              </Link>
            </div>
            
            <nav className="flex space-x-4">
              <Link 
                href="/admin/productos/nuevo"
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
              >
                + Nuevo Producto
              </Link>
              <Link 
                href="/"
                className="text-amber-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Ver Chatbot
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}