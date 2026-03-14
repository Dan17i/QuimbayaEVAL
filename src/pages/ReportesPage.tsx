import React, { useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileDown, Filter, RefreshCw } from 'lucide-react';
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
import { useDocentes } from '../hooks/useDocentes';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export const ReportesPage: React.FC = () => {
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();
  const { docentes, loading: loadingDocentes } = useDocentes();
  const reporteRef = useRef<HTMLDivElement>(null);

  const [filtroCurso, setFiltroCurso] = useState<string>('all');
  const [filtroDocente, setFiltroDocente] = useState<string>('all');

  const loading = loadingEvals || loadingCursos || loadingDocentes;

  // Evaluaciones filtradas según selección
  const evaluacionesFiltradas = useMemo(() => {
    let result = evaluaciones;
    if (filtroCurso !== 'all') result = result.filter(e => e.curso === filtroCurso);
    // filtro por docente: necesitamos saber qué cursos pertenecen al docente
    // el campo profesor viene del mapeo en useEvaluaciones si el back lo retorna
    if (filtroDocente !== 'all') {
      const docenteId = Number(filtroDocente);
      const cursosDelDocente = cursos
        .filter(c => c.profesorId === docenteId)
        .map(c => c.codigo);
      result = result.filter(e => cursosDelDocente.includes(e.curso));
    }
    return result;
  }, [evaluaciones, cursos, filtroCurso, filtroDocente]);

  const evaluacionesPorCurso = useMemo(() => {
    const cursosBase = filtroCurso !== 'all'
      ? cursos.filter(c => c.codigo === filtroCurso)
      : filtroDocente !== 'all'
        ? cursos.filter(c => c.profesorId === Number(filtroDocente))
        : cursos;

    return cursosBase.map(c => ({
      curso: c.codigo,
      nombre: c.nombre,
      total: evaluacionesFiltradas.filter(e => e.curso === c.codigo).length,
      activas: evaluacionesFiltradas.filter(e => e.curso === c.codigo && e.estado === 'Activa').length,
      cerradas: evaluacionesFiltradas.filter(e => e.curso === c.codigo && e.estado === 'Cerrada').length,
    })).filter(c => c.total > 0);
  }, [cursos, evaluacionesFiltradas, filtroCurso, filtroDocente]);

  const distribucionEstados = useMemo(() => {
    const estados = ['Activa', 'Cerrada', 'Programada', 'Borrador'] as const;
    return estados.map(estado => ({
      estado,
      cantidad: evaluacionesFiltradas.filter(e => e.estado === estado).length,
    })).filter(e => e.cantidad > 0);
  }, [evaluacionesFiltradas]);

  const estadisticasKPIs = useMemo<Estadistica[]>(() => [
    { label: 'Cursos', value: String(evaluacionesPorCurso.length), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Evaluaciones', value: String(evaluacionesFiltradas.length), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Activas', value: String(evaluacionesFiltradas.filter(e => e.estado === 'Activa').length), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cerradas', value: String(evaluacionesFiltradas.filter(e => e.estado === 'Cerrada').length), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], [evaluacionesPorCurso, evaluacionesFiltradas]);

  const docenteSeleccionado = docentes.find(d => String(d.id) === filtroDocente);
  const cursoSeleccionado = cursos.find(c => c.codigo === filtroCurso);

  const tituloReporte = [
    docenteSeleccionado ? `Docente: ${docenteSeleccionado.name}` : null,
    cursoSeleccionado ? `Curso: ${cursoSeleccionado.codigo}` : null,
  ].filter(Boolean).join(' | ') || 'Todos los cursos y docentes';

  const handleExportarPDF = async () => {
    if (!reporteRef.current) return;
    const toastId = toast.loading('Generando PDF...');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(reporteRef.current, { scale: 2, useCORS: true }) as any;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`reporte-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF generado', { id: toastId, description: 'Archivo descargado correctamente' });
    } catch {
      toast.error('Error al generar PDF', { id: toastId });
    }
  };

  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen
      const wsResumen = XLSX.utils.aoa_to_sheet([
        ['Reporte QuimbayaEVAL', new Date().toLocaleDateString('es-CO')],
        ['Filtro', tituloReporte],
        [],
        ['KPI', 'Valor'],
        ['Total Cursos', evaluacionesPorCurso.length],
        ['Total Evaluaciones', evaluacionesFiltradas.length],
        ['Activas', evaluacionesFiltradas.filter(e => e.estado === 'Activa').length],
        ['Cerradas', evaluacionesFiltradas.filter(e => e.estado === 'Cerrada').length],
      ]);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      // Hoja 2: Por curso
      const wsCursos = XLSX.utils.aoa_to_sheet([
        ['Código', 'Nombre', 'Total', 'Activas', 'Cerradas'],
        ...evaluacionesPorCurso.map(c => [c.curso, c.nombre, c.total, c.activas, c.cerradas]),
      ]);
      XLSX.utils.book_append_sheet(wb, wsCursos, 'Por Curso');

      // Hoja 3: Por estado
      const wsEstados = XLSX.utils.aoa_to_sheet([
        ['Estado', 'Cantidad'],
        ...distribucionEstados.map(e => [e.estado, e.cantidad]),
      ]);
      XLSX.utils.book_append_sheet(wb, wsEstados, 'Por Estado');

      XLSX.writeFile(wb, `reporte-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel generado', { description: 'Archivo descargado correctamente' });
    } catch {
      toast.error('Error al generar Excel');
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroCurso('all');
    setFiltroDocente('all');
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Docente</label>
            <Select value={filtroDocente} onValueChange={setFiltroDocente}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los docentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los docentes</SelectItem>
                {docentes.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Curso</label>
            <Select value={filtroCurso} onValueChange={setFiltroCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursos
                  .filter(c => filtroDocente === 'all' || c.profesorId === Number(filtroDocente))
                  .map(c => (
                    <SelectItem key={c.id} value={c.codigo}>{c.codigo} - {c.nombre}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            className="w-full flex items-center gap-2"
            onClick={handleLimpiarFiltros}
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar filtros
          </Button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Los filtros aplican tanto a las gráficas como a la exportación PDF y Excel.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['coordinador', 'maestro']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Reportes' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Reportes y Análisis</h2>
              <p className="text-gray-500 mt-1 text-sm">{tituloReporte}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleExportarPDF}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
              <Button className="flex items-center gap-2" onClick={handleExportarExcel}>
                <FileDown className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando datos..." />
          ) : (
            <div ref={reporteRef} className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {estadisticasKPIs.map((stat) => <StatCard key={stat.label} stat={stat} />)}
              </div>

              {/* Gráfica por curso */}
              {evaluacionesPorCurso.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluaciones por Curso</CardTitle>
                    <CardDescription>Total registradas por materia</CardDescription>
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
                    <ResponsiveContainer width="100%" height={220}>
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

              {/* Tabla detallada */}
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
                              <TableHead>Código</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Activas</TableHead>
                              <TableHead>Cerradas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {evaluacionesPorCurso.map((curso) => (
                              <TableRow key={curso.curso}>
                                <TableCell>{curso.curso}</TableCell>
                                <TableCell>{curso.nombre}</TableCell>
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

              {evaluacionesPorCurso.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Filter className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p>No hay datos para los filtros seleccionados.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
