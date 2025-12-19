import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Home, LogOut, BookOpen, Users, BarChart3, MessageSquare, FileText, ClipboardList, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  sidebar?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, breadcrumbs, sidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = React.useMemo(() => {
    if (!user) return [];

    switch (user.role) {
      case 'maestro':
        return [
          { icon: Home, label: 'Dashboard', href: '/dashboard' },
          { icon: FileText, label: 'Evaluaciones', href: '/evaluaciones' },
          { icon: ClipboardList, label: 'Calificar', href: '/calificar' },
          { icon: BarChart3, label: 'Reportes', href: '/reportes' },
          { icon: MessageSquare, label: 'PQRS', href: '/pqrs' },
        ];
      case 'estudiante':
        return [
          { icon: Home, label: 'Dashboard', href: '/dashboard' },
          { icon: BookOpen, label: 'Mis Cursos', href: '/mis-cursos' },
          { icon: FileText, label: 'Mis Evaluaciones', href: '/mis-evaluaciones' },
          { icon: ClipboardList, label: 'Historial', href: '/historial' },
          { icon: MessageSquare, label: 'PQRS', href: '/pqrs' },
        ];
      case 'coordinador':
        return [
          { icon: Home, label: 'Dashboard', href: '/dashboard' },
          { icon: BarChart3, label: 'Reportes', href: '/reportes' },
          { icon: Users, label: 'Usuarios', href: '/usuarios' },
          { icon: MessageSquare, label: 'PQRS', href: '/pqrs' },
        ];
      default:
        return [];
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Aplicando principio de Proximidad (Gestalt) - Optimizado para móvil */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          {/* Menú móvil y Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Menú hamburguesa para móvil */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-blue-600">QuimbayaEVAL</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Menú de navegación principal
                  </SheetDescription>
                </SheetHeader>
                <nav className="p-4 space-y-2" aria-label="Navegación móvil">
                  {navigationItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        location.pathname === item.href 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo y marca */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg" role="img" aria-label="Logo QuimbayaEVAL">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-blue-600 text-base sm:text-xl lg:text-2xl">QuimbayaEVAL</h1>
            </div>
          </div>
          {/* Información de usuario agrupada - Responsivo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              aria-label="Cerrar sesión"
              className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Aplicando principio de Semejanza (Gestalt) - Oculto en móvil */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)] lg:min-h-[calc(100vh-73px)] sticky top-[65px] lg:top-[73px]">
          <nav className="p-3 lg:p-4 space-y-1" aria-label="Navegación principal">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.href 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                aria-current={location.pathname === item.href ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate text-sm lg:text-base">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content - Aplicando sistema de espaciado 8pt */}
        <main className="flex-1" role="main">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {crumb.href ? (
                          <BreadcrumbLink 
                            onClick={() => navigate(crumb.href!)} 
                            className="cursor-pointer hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Grid responsivo con principio de Continuidad (Gestalt) */}
            <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${sidebar ? 'lg:grid-cols-[320px_1fr]' : ''}`}>
              {sidebar && <div className="order-2 lg:order-1">{sidebar}</div>}
              <div className={sidebar ? 'order-1 lg:order-2' : ''}>{children}</div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer - Aplicando contraste WCAG 2.1 AA - Optimizado para móvil */}
      <footer className="bg-gray-800 text-white mt-8 sm:mt-12 lg:mt-16" role="contentinfo">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Información del sistema */}
            <div>
              <h3 className="text-base sm:text-lg mb-3 sm:mb-4">QuimbayaEVAL</h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                Sistema de Gestión de Evaluaciones Académicas
              </p>
            </div>
            
            {/* Enlaces útiles */}
            <div>
              <h3 className="text-base sm:text-lg mb-3 sm:mb-4">Enlaces</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                    Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                    Términos de uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                    Privacidad
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Contacto */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg mb-3 sm:mb-4">Contacto</h3>
              <address className="text-gray-300 text-xs sm:text-sm not-italic">
                <p>SENA - Centro de Formación</p>
                <p>Quimbaya, Quindío</p>
                <p className="mt-2">
                  <a href="mailto:soporte@quimbayaeval.edu.co" className="hover:text-white transition-colors break-all">
                    soporte@quimbayaeval.edu.co
                  </a>
                </p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-400 space-y-1 sm:space-y-2">
            <p>© 2025 QuimbayaEVAL - Todos los derechos reservados</p>
            <p>
              Cumpliendo con estándares de accesibilidad WCAG 2.1 AA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
