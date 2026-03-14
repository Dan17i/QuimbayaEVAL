import React, { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { BarChart3, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '../utils/format';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';

export const ReportesPage: React.FC = () => {
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();

  const loading = loadingEvals || loadingCursos;

  // Evaluaciones por curso (datos reales)
  const evaluacionesPorCurso = useMemo(() =>
    cursos.map(c => ({
      curso: c.codigo,
      total: evaluaciones.filter(e => e.curso === c.codigo).length,
      activas: evaluaciones.filter(e => e.curso === c.codigo && e.estado === 'Activa').length,
      cerradas: evaluaciones.filter(e => e.curso === c.codigo && e.estado === 'Cerrada').length,
    })).filter(c => c.total > 0),
    [cursos, evaluaciones]
  );

  // Distribución por estado
  const distribucionEstados = useMemo(() => {
    const estados = ['Activa', 'Cerrada', 'Programada', 'Borrador'] as const;
    return estados.map(estado => ({
      estado,
      cantidad: evaluaciones.filter(e => e.estado === estado).length,
    })).filter(e => e.cantidad > 0);
  }, [evaluaciones]);

  const estadisticasKPIs = useMemo<Estadistica[]>(() => [
    { label: 'Total Cursos', value: String(cursos.length), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Evaluaciones Activas', value: String(evaluaciones.filter(e => e.estado === 'Activa').length), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Evaluaciones Cerradas', value: String(evaluaciones.filter(e => e.estado === 'Cerrada').length), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], [cursos, evaluaciones]);

  return (
    <ProtectedRoute allowedRoles={['coordinador', 'maestro']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Reportes' }]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Reportes y Análisis</h2>
              <p className="text-gray-600 mt-2">Métricas reales de evaluaciones y cursos</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => toast.info('PDF', { description: 'Exportación próximamente' })}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
              <Button className="flex items-center gap-2" onClick={() => toast.info('Excel', { description: 'Exportación próximamente' })}>
                <FileDown className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando datos..." />
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {estadisticasKPIs.map((stat) => <StatCard key={stat.label} stat={stat} />)}
              </div>

              {/* Gráfica evaluaciones por curso */}
              {evaluacionesPorCurso.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluaciones por Curso</CardTitle>
                    <CardDescription>Total de evaluaciones registradas por materia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={evaluacionesPorCurso}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="curso" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total" />
                        <Bar dataKey="activas" fill="#10b981" radius={[8, 8, 0, 0]} name="Activas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Distribución por estado */}
              {distribucionEstados.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Estado</CardTitle>
                    <CardDescription>Evaluaciones agrupadas por estado actual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={distribucionEstados} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="estado" width={90} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Cantidad" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Tabla detallada por curso */}
              {evaluacionesPorCurso.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle por Curso</CardTitle>
                    <CardDescription>Vista completa de métricas por materia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-6">
                      <div className="inline-block min-w-full px-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Curso</TableHead>
                              <TableHead>Total Evaluaciones</TableHead>
                              <TableHead>Activas</TableHead>
                              <TableHead>Cerradas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {evaluacionesPorCurso.map((curso) => (
                              <TableRow key={curso.curso}>
                                <TableCell>{curso.curso}</TableCell>
                                <TableCell>{formatNumber(curso.total)}</TableCell>
                                <TableCell><span className="text-green-600">{curso.activas}</span></TableCell>
                                <TableCell><span className="text-blue-600">{curso.cerradas}</span></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
