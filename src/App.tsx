import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy loading de páginas para mejor performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardMaestro = lazy(() => import('./pages/DashboardMaestro').then(module => ({ default: module.DashboardMaestro })));
const DashboardEstudiante = lazy(() => import('./pages/DashboardEstudiante').then(module => ({ default: module.DashboardEstudiante })));
const DashboardCoordinador = lazy(() => import('./pages/DashboardCoordinador').then(module => ({ default: module.DashboardCoordinador })));
const EvaluacionesPage = lazy(() => import('./pages/EvaluacionesPage').then(module => ({ default: module.EvaluacionesPage })));
const CrearEvaluacionPage = lazy(() => import('./pages/CrearEvaluacionPage').then(module => ({ default: module.CrearEvaluacionPage })));
const CalificarPage = lazy(() => import('./pages/CalificarPage').then(module => ({ default: module.CalificarPage })));
const MisEvaluacionesPage = lazy(() => import('./pages/MisEvaluacionesPage').then(module => ({ default: module.MisEvaluacionesPage })));
const HistorialPage = lazy(() => import('./pages/HistorialPage').then(module => ({ default: module.HistorialPage })));
const ReportesPage = lazy(() => import('./pages/ReportesPage').then(module => ({ default: module.ReportesPage })));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage').then(module => ({ default: module.UsuariosPage })));
const PQRSPage = lazy(() => import('./pages/PQRSPage').then(module => ({ default: module.PQRSPage })));
const MisCursosPage = lazy(() => import('./pages/MisCursosPage').then(module => ({ default: module.MisCursosPage })));
const RealizarEvaluacionPage = lazy(() => import('./pages/RealizarEvaluacionPage').then(module => ({ default: module.RealizarEvaluacionPage })));

/**
 * Componente ProtectedRoute para validar autenticación y roles
 */
interface ProtectedRouteProps {
  allowedRoles?: Array<'maestro' | 'estudiante' | 'coordinador'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps & { children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta sección.</p>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Router principal con todas las rutas
 */
function AppRouter() {
  const { user, isAuthenticated } = useAuth();

  // Dashboard condicional según rol
  const DashboardPage = React.useMemo(() => {
    if (!user) return null;
    switch (user.role) {
      case 'maestro':
        return DashboardMaestro;
      case 'estudiante':
        return DashboardEstudiante;
      case 'coordinador':
        return DashboardCoordinador;
      default:
        return DashboardEstudiante;
    }
  }, [user]);

  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Cargando..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {DashboardPage && <DashboardPage />}
          </ProtectedRoute>
        }
      />

      {/* Maestro Routes */}
      <Route
        path="/evaluaciones"
        element={
          <ProtectedRoute allowedRoles={['maestro', 'coordinador']}>
            <EvaluacionesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluaciones/nueva"
        element={
          <ProtectedRoute allowedRoles={['maestro']}>
            <CrearEvaluacionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calificar"
        element={
          <ProtectedRoute allowedRoles={['maestro']}>
            <CalificarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute allowedRoles={['maestro', 'coordinador']}>
            <ReportesPage />
          </ProtectedRoute>
        }
      />

      {/* Estudiante Routes */}
      <Route
        path="/mis-cursos"
        element={
          <ProtectedRoute allowedRoles={['estudiante']}>
            <MisCursosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-evaluaciones"
        element={
          <ProtectedRoute allowedRoles={['estudiante']}>
            <MisEvaluacionesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/realizar-evaluacion"
        element={
          <ProtectedRoute allowedRoles={['estudiante']}>
            <RealizarEvaluacionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial"
        element={
          <ProtectedRoute allowedRoles={['estudiante']}>
            <HistorialPage />
          </ProtectedRoute>
        }
      />

      {/* Coordinador Routes */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={['coordinador']}>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />

      {/* Common Routes */}
      <Route
        path="/pqrs"
        element={
          <ProtectedRoute>
            <PQRSPage />
          </ProtectedRoute>
        }
      />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

/**
 * App Principal con ErrorBoundary y Providers
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
