import React, { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, FileText, Users } from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';

export const MisCursosPage: React.FC = () => {
  const { cursos, loading: loadingCursos } = useCursos();
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();

  const loading = loadingCursos || loadingEvals;

  const estadisticas = useMemo<Estadistica[]>(() => [
    { label: 'Cursos Inscritos', value: String(cursos.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Evaluaciones Abiertas', value: String(evaluaciones.filter(e => e.estado === 'Activa').length), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
  ], [cursos, evaluaciones]);

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Mis Cursos' }]}>
        <div className="space-y-6 lg:space-y-8">
          <div>
            <h2>Mis Cursos</h2>
            <p className="text-gray-600 mt-2">Cursos en los que estás inscrito</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {estadisticas.map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando cursos..." />
          ) : cursos.length === 0 ? (
            <EmptyState icon={BookOpen} title="No tienes cursos" description="No estás inscrito en ningún curso en este momento." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cursos.map((curso) => {
                const evsCurso = evaluaciones.filter(e => e.curso === curso.codigo);
                const evsActivas = evsCurso.filter(e => e.estado === 'Activa');
                return (
                  <Card key={curso.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{curso.codigo} - {curso.nombre}</CardTitle>
                      {curso.descripcion && (
                        <CardDescription>{curso.descripcion}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{evsCurso.length} evaluaciones</span>
                        {evsActivas.length > 0 && (
                          <span className="text-orange-600">{evsActivas.length} abiertas</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
