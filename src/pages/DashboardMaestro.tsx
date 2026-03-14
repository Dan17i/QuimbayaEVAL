import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, ClipboardList, BarChart3, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { EstadoEvaluacion, Estadistica } from '../types';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { MessageSquare, Users } from 'lucide-react';

export const DashboardMaestro: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evaluaciones, evaluacionesRecientes, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();

  const loading = loadingEvals || loadingCursos;

  const evaluacionesActivas = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Activa'), [evaluaciones]
  );

  const porCalificar = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Cerrada'), [evaluaciones]
  );

  const estadisticas = useMemo<Estadistica[]>(() => [
    { label: 'Evaluaciones Activas', value: String(evaluacionesActivas.length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Por Calificar', value: String(porCalificar.length), icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Mis Cursos', value: String(cursos.length), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
  ], [evaluacionesActivas, porCalificar, cursos, evaluaciones]);

  const getEstadoBadge = (estado: EstadoEvaluacion) => {
    const badges = {
      'Activa': <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs"><Clock className="w-3 h-3" /> Activa</span>,
      'Cerrada': <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs"><CheckCircle className="w-3 h-3" /> Cerrada</span>,
      'Programada': <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs"><Clock className="w-3 h-3" /> Programada</span>,
      'Borrador': <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs"><AlertCircle className="w-3 h-3" /> Borrador</span>,
    };
    return badges[estado as keyof typeof badges];
  };

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Bienvenido, {user?.name || 'Profesor'}</h2>
              <p className="text-gray-600 mt-2">Resumen de tus evaluaciones y actividad reciente</p>
            </div>
            <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => navigate(ROUTES.CREAR_EVALUACION)}>
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              estadisticas.map((stat) => <StatCard key={stat.label} stat={stat} />)
            )}
          </div>

          {/* Evaluaciones Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluaciones Recientes</CardTitle>
              <CardDescription>Gestiona tus evaluaciones activas y próximas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Cargando...</p>
              ) : evaluacionesRecientes.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay evaluaciones aún.</p>
              ) : (
                <div className="space-y-4">
                  {evaluacionesRecientes.map((evaluacion) => (
                    <div key={evaluacion.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-gray-900 truncate">{evaluacion.name}</h3>
                          {getEstadoBadge(evaluacion.estado)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                          <span>Curso: {evaluacion.curso}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Límite: {formatDate(evaluacion.deadline)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {evaluacion.estado === 'Borrador' && (
                          <Button variant="outline" size="sm">Editar</Button>
                        )}
                        {evaluacion.estado === 'Cerrada' && (
                          <Button size="sm" onClick={() => navigate(ROUTES.CALIFICAR)}>Calificar</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.CREAR_EVALUACION)}>
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Crear Evaluación</CardTitle>
                <CardDescription>Inicia una nueva evaluación desde cero</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.CALIFICAR)}>
              <CardHeader>
                <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Calificar</CardTitle>
                <CardDescription>Revisa y califica las evaluaciones pendientes</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-green-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.REPORTES)}>
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Ver Reportes</CardTitle>
                <CardDescription>Analiza el desempeño de tus estudiantes</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
