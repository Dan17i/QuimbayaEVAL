import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { StatCard } from '../components/StatCard';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { estadisticasEstudiante } from '../services/mockData';
import { formatDateTime, formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const DashboardEstudiante: React.FC = () => {
  const navigate = useNavigate();
  const { evaluaciones, loading: loadingEvaluaciones, error: errorEvaluaciones } = useEvaluaciones();
  const { cursos, loading: loadingCursos, error: errorCursos } = useCursos();
  const [loading] = useState(false); // En el futuro vendrá del hook de datos

  const evaluacionesAbiertas = evaluaciones.filter(e => e.estado === 'Activa');
  const cursosActivos = cursos.filter(c => c.estado === 'Activo');

  if (loadingEvaluaciones || loadingCursos) {
    return <LoadingSpinner size="lg" text="Cargando datos..." />;
  }

  if (errorEvaluaciones || errorCursos) {
    return <EmptyState icon={AlertCircle} title="Error al cargar datos" description="No se pudieron cargar las evaluaciones o cursos." />;
  }

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-8">
          <div>
            <h2>Mi Panel de Estudiante</h2>
            <p className="text-gray-600 mt-2">Revisa tus evaluaciones pendientes y progreso académico</p>
          </div>

          {/* Stats Grid - Optimizado para móvil */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))
            ) : (
              estadisticasEstudiante.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))
            )}
          </div>

          {/* Evaluaciones Abiertas - Principio de Cierre (Gestalt) y contraste de color */}
          <Card className="border-l-4 border-l-orange-500 shadow-lg bg-gradient-to-r from-orange-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-full" aria-hidden="true">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Evaluaciones Abiertas - Requieren tu Atención</CardTitle>
              </div>
              <CardDescription>Completa estas evaluaciones antes de la fecha límite</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" role="list" aria-label="Evaluaciones pendientes">
                {evaluacionesAbiertas.map((evaluacion) => (
                  <article 
                    key={evaluacion.id} 
                    className="bg-white p-6 border border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    role="listitem"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        {/* Título y tipo - Proximidad */}
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-gray-900">{evaluacion.name}</h3>
                          <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs">
                            {evaluacion.tipo}
                          </span>
                        </div>
                        
                        {/* Información agrupada - Sistema 8pt */}
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col">
                            <dt className="text-gray-600">Curso</dt>
                            <dd className="text-gray-900 mt-1">{evaluacion.curso}</dd>
                          </div>
                          <div className="flex flex-col">
                            <dt className="text-gray-600">Profesor</dt>
                            <dd className="text-gray-900 mt-1">{evaluacion.profesor}</dd>
                          </div>
                          <div className="flex flex-col">
                            <dt className="text-gray-600">Fecha límite</dt>
                            <dd className="text-orange-700 mt-1">{formatDateTime(evaluacion.deadline)}</dd>
                          </div>
                          <div className="flex flex-col">
                            <dt className="text-gray-600">Duración</dt>
                            <dd className="text-gray-900 mt-1">{evaluacion.duracion}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <Button 
                        className="w-full lg:w-auto flex-shrink-0 bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2" 
                        onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}
                        aria-label={`Iniciar evaluación: ${evaluacion.name}`}
                      >
                        Iniciar Evaluación
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cursos Activos */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos Activos</CardTitle>
              <CardDescription>Progreso y próximas evaluaciones por curso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cursosActivos.map((curso) => (
                  <div key={curso.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-gray-900">{curso.codigo} - {curso.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Próxima evaluación: <span className="text-gray-900">{curso.proxEval}</span> • {formatDate(curso.evalDate)}
                        </p>
                      </div>
                      <span className="text-blue-600">{curso.progreso}%</span>
                    </div>
                    <Progress value={curso.progreso} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Semejanza y Continuidad (Gestalt) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="navigation" aria-label="Acciones rápidas">
            <Card 
              className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-500" 
              onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.MIS_EVALUACIONES)}
              aria-label="Ir a mis evaluaciones"
            >
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Mis Evaluaciones</CardTitle>
                <CardDescription>Ver todas las evaluaciones por curso</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-green-500" 
              onClick={() => navigate(ROUTES.HISTORIAL)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.HISTORIAL)}
              aria-label="Ir a historial"
            >
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Historial</CardTitle>
                <CardDescription>Revisa tus calificaciones y feedback</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-purple-500"
              onClick={() => navigate(ROUTES.MIS_CURSOS)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate(ROUTES.MIS_CURSOS)}
              aria-label="Ir a mis cursos"
            >
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Mis Cursos</CardTitle>
                <CardDescription>Explora materiales y recursos de aprendizaje</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
