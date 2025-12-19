import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, ClipboardList, BarChart3, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { estadisticasMaestro } from '../services/mockData';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { EstadoEvaluacion } from '../types';
import { useState } from 'react';
import { StatCardSkeleton } from '../components/SkeletonLoader';

export const DashboardMaestro: React.FC = () => {
  const navigate = useNavigate();
  const { evaluacionesRecientes } = useEvaluaciones();
  const [loading] = useState(false); // En el futuro vendrá del hook de datos

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
          <div className="flex items-center justify-between">
            <div>
              <h2>Bienvenido, Profesor</h2>
              <p className="text-gray-600 mt-2">Resumen de tus evaluaciones y actividad reciente</p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => navigate(ROUTES.CREAR_EVALUACION)}>
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Button>
          </div>

          {/* Stats Grid - Optimizado para móvil */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))
            ) : (
              estadisticasMaestro.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))
            )}
          </div>

          {/* Recent Evaluaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluaciones Recientes</CardTitle>
              <CardDescription>Gestiona tus evaluaciones activas y próximas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluacionesRecientes.map((evaluacion) => (
                  <div key={evaluacion.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-gray-900">{evaluacion.name}</h3>
                        {getEstadoBadge(evaluacion.estado)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Curso: {evaluacion.curso}</span>
                        <span>•</span>
                        <span>Fecha límite: {formatDate(evaluacion.deadline)}</span>
                        {evaluacion.pendientes && evaluacion.pendientes > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600">{evaluacion.pendientes} por calificar</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {evaluacion.estado === 'Borrador' && (
                        <Button variant="outline" size="sm">Editar</Button>
                      )}
                      {evaluacion.pendientes && evaluacion.pendientes > 0 && (
                        <Button size="sm" onClick={() => navigate(ROUTES.CALIFICAR)}>Calificar</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Semejanza y Continuidad (Gestalt) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="navigation" aria-label="Acciones rápidas">
            <Card 
              className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-500" 
              onClick={() => navigate(ROUTES.CREAR_EVALUACION)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.CREAR_EVALUACION)}
              aria-label="Crear nueva evaluación"
            >
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Crear Evaluación</CardTitle>
                <CardDescription>Inicia una nueva evaluación desde cero o usa plantillas</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-orange-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-orange-500" 
              onClick={() => navigate(ROUTES.CALIFICAR)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.CALIFICAR)}
              aria-label="Calificar evaluaciones"
            >
              <CardHeader>
                <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Calificar</CardTitle>
                <CardDescription>Revisa y califica las evaluaciones pendientes</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-green-500" 
              onClick={() => navigate(ROUTES.REPORTES)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.REPORTES)}
              aria-label="Ver reportes de desempeño"
            >
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
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
