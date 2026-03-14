import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, BookOpen, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { Estadistica } from '../types';

export const DashboardEstudiante: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const estudianteId = user ? Number(user.id) : undefined;

  const { evaluaciones, loading: loadingEvals, error: errorEvals, refetch: refetchEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos, error: errorCursos, refetch: refetchCursos } = useCursos();
  const { submissions, loading: loadingSubs } = useSubmissions(estudianteId);

  const evaluacionesAbiertas = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Activa'),
    [evaluaciones]
  );

  const completadas = useMemo(() =>
    submissions.filter(s => s.estado === 'Calificada' || s.estado === 'Enviada'),
    [submissions]
  );

  const estadisticas = useMemo<Estadistica[]>(() => [
    { label: 'Cursos Inscritos', value: String(cursos.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Evaluaciones Abiertas', value: String(evaluacionesAbiertas.length), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completadas', value: String(completadas.length), icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ], [cursos, evaluacionesAbiertas, completadas, evaluaciones]);

  const loading = loadingEvals || loadingCursos || loadingSubs;

  if (errorEvals || errorCursos) {
    return (
      <ProtectedRoute allowedRoles={['estudiante']}>
        <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
          <EmptyState
            icon={AlertCircle}
            title="Error al cargar datos"
            description={errorEvals || errorCursos || 'No se pudieron cargar los datos del dashboard.'}
            actionLabel="Reintentar"
            onAction={() => { refetchEvals(); refetchCursos(); }}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-8">
          <div>
            <h2>Mi Panel de Estudiante</h2>
            <p className="text-gray-600 mt-2">Revisa tus evaluaciones pendientes y progreso académico</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              estadisticas.map((stat) => <StatCard key={stat.label} stat={stat} />)
            )}
          </div>

          {/* Evaluaciones Abiertas */}
          <Card className="border-l-4 border-l-orange-500 shadow-lg bg-gradient-to-r from-orange-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Evaluaciones Abiertas - Requieren tu Atención</CardTitle>
              </div>
              <CardDescription>Completa estas evaluaciones antes de la fecha límite</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Cargando...</p>
              ) : evaluacionesAbiertas.length === 0 ? (
                <EmptyState icon={CheckCircle} title="Sin evaluaciones pendientes" description="No tienes evaluaciones abiertas en este momento." />
              ) : (
                <div className="space-y-4">
                  {evaluacionesAbiertas.map((evaluacion) => (
                    <article key={evaluacion.id} className="bg-white p-6 border border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-gray-900">{evaluacion.name}</h3>
                            <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs">
                              {evaluacion.tipo}
                            </span>
                          </div>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                              <dt className="text-gray-600">Curso</dt>
                              <dd className="text-gray-900 mt-1">{evaluacion.curso}</dd>
                            </div>
                            {evaluacion.profesor && (
                              <div className="flex flex-col">
                                <dt className="text-gray-600">Profesor</dt>
                                <dd className="text-gray-900 mt-1">{evaluacion.profesor}</dd>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <dt className="text-gray-600">Fecha límite</dt>
                              <dd className="text-orange-700 mt-1">{formatDateTime(evaluacion.deadline)}</dd>
                            </div>
                            {evaluacion.duracion && (
                              <div className="flex flex-col">
                                <dt className="text-gray-600">Duración</dt>
                                <dd className="text-gray-900 mt-1">{evaluacion.duracion}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        <Button
                          className="w-full lg:w-auto flex-shrink-0 bg-orange-600 hover:bg-orange-700"
                          onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}
                        >
                          Iniciar Evaluación
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cursos Activos */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos Activos</CardTitle>
              <CardDescription>Cursos en los que estás inscrito</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Cargando...</p>
              ) : cursos.length === 0 ? (
                <EmptyState icon={BookOpen} title="Sin cursos" description="No estás inscrito en ningún curso." />
              ) : (
                <div className="space-y-4">
                  {cursos.slice(0, 4).map((curso) => (
                    <div key={curso.id} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="text-gray-900">{curso.codigo} - {curso.nombre}</h3>
                      {curso.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">{curso.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}>
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Mis Evaluaciones</CardTitle>
                <CardDescription>Ver todas las evaluaciones por curso</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-green-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.HISTORIAL)}>
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Historial</CardTitle>
                <CardDescription>Revisa tus calificaciones y feedback</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.MIS_CURSOS)}>
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
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
