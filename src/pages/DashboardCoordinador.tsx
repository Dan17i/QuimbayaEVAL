import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, BarChart3, TrendingUp, FileDown, AlertTriangle, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { StatCardSkeleton } from '../components/SkeletonLoader';

export const DashboardCoordinador: React.FC = () => {
  const navigate = useNavigate();
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();

  const loading = loadingEvals || loadingCursos;

  // Construir datos de gráfica a partir de cursos reales
  const desempenoPorCurso = useMemo(() =>
    cursos.slice(0, 8).map(c => ({
      curso: c.codigo,
      evaluaciones: evaluaciones.filter(e => e.curso === c.codigo).length,
    })),
    [cursos, evaluaciones]
  );

  const evaluacionesActivas = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Activa'), [evaluaciones]
  );

  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2>Panel de Coordinación</h2>
              <p className="text-gray-600 mt-2">Indicadores institucionales y reportes analíticos</p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => navigate('/reportes')}>
              <FileDown className="w-4 h-4" />
              Exportar Reporte
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Cursos</p>
                        <p className="text-3xl mt-2">{cursos.length}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Evaluaciones Activas</p>
                        <p className="text-3xl mt-2">{evaluacionesActivas.length}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Evaluaciones</p>
                        <p className="text-3xl mt-2">{evaluaciones.length}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Cerradas</p>
                        <p className="text-3xl mt-2">{evaluaciones.filter(e => e.estado === 'Cerrada').length}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Gráfica evaluaciones por curso */}
          {!loading && desempenoPorCurso.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evaluaciones por Curso</CardTitle>
                <CardDescription>Cantidad de evaluaciones registradas por materia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={desempenoPorCurso}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="curso" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="evaluaciones" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate('/reportes')}>
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Reportes Avanzados</CardTitle>
                <CardDescription>Consulta KPIs, filtra por curso y exporta a PDF/XLSX</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-green-300 transition-all cursor-pointer" onClick={() => navigate('/usuarios')}>
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Crear, editar roles y activar/bloquear cuentas</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer" onClick={() => navigate('/cursos')}>
              <CardHeader>
                <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Gestión de Cursos</CardTitle>
                <CardDescription>Crea cursos, asigna docentes y matricula estudiantes</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer" onClick={() => navigate('/pqrs')}>
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <FileDown className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>PQRS</CardTitle>
                <CardDescription>Gestiona peticiones, quejas y reclamos</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
