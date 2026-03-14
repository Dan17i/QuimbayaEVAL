import React, { useMemo, useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileDown, RefreshCw, Users, BarChart3, TrendingUp, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '../utils/format';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useDocentes } from '../hooks/useDocentes';
import { useAuth } from '../contexts/AuthContext';
import { resultadosService, ResultadoDetalle, ResumenCurso } from '../services/resultadosService';
import { cursosService, Curso } from '../services/cursosService';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const ReportesPage: React.FC = () => {
  const { user } = useAuth();
  const isCoordinador = user?.role === 'coordinador';

  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();
  const { docentes, loading: loadingDocentes } = useDocentes();

  // Filtros
  const [filtroDocente, setFiltroDocente] = useState<string>('all');
  const [filtroCursoId, setFiltroCursoId] = useState<string>('');

  // Datos de notas
  const [notasEstudiantes, setNotasEstudiantes] = useState<ResultadoDetalle[]>([]);
  const [resumenGrupo, setResumenGrupo] = useState<ResumenCurso[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);

  const loading = loadingEvals || loadingCursos || (isCoordinador && loadingDocentes);

  // Cursos filtrados por docente (coordinador) o todos (maestro)
  const cursosFiltrados = useMemo(() => {
    if (!isCoordinador) return cursos;
    if (filtroDocente === 'all') return cursos;
    return cursos.filter(c => c.profesorId === Number(filtroDocente));
  }, [cursos, filtroDocente, isCoordinador]);

  // Al cambiar curso, cargar notas
  useEffect(() => {
    if (!filtroCursoId) return;
    const id = Number(filtroCursoId);
    setLoadingNotas(true);
    Promise.all([
      resultadosService.getByCurso(id),
      resultadosService.getResumenCurso(id),
    ]).then(([notas, resumen]) => {
      setNotasEstudiantes(notas);
      setResumenGrupo(resumen);
    }).catch(() => {
      toast.error('Error al cargar notas del curso');
    }).finally(() => setLoadingNotas(false));
  }, [filtroCursoId]);

  // Cuando cambia docente, resetear curso
  useEffect(() => {
    setFiltroCursoId('');
    setNotasEstudiantes([]);
    setResumenGrupo([]);
  }, [filtroDocente]);

  const cursoActual = cursos.find(c => String(c.id) === filtroCursoId);

  // KPIs generales
  const estadisticasKPIs = useMemo<Estadistica[]>(() => [
    { label: 'Total Cursos', value: String(cursosFiltrados.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Activas', value: String(evaluaciones.filter(e => e.estado === 'Activa').length), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cerradas', value: String(evaluaciones.filter(e => e.estado === 'Cerrada').length), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], [cursosFiltrados, evaluaciones]);

  // Promedio general del grupo (de resumenGrupo)
  const promedioGeneral = useMemo(() => {
    if (resumenGrupo.length === 0) return null;
    const sum = resumenGrupo.reduce((acc, r) => acc + r.promedioEscala, 0);
    return (sum / resumenGrupo.length).toFixed(1);
  }, [resumenGrupo]);

  const totalAprobados = useMemo(() =>
    resumenGrupo.reduce((acc, r) => acc + r.aprobados, 0), [resumenGrupo]);

  const totalReprobados = useMemo(() =>
    resumenGrupo.reduce((acc, r) => acc + r.reprobados, 0), [resumenGrupo]);

  // --- EXPORTAR PDF ---
  const handleExportarPDF = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Encabezado
      pdf.setFontSize(16);
      pdf.setTextColor(30, 64, 175);
      pdf.text('Reporte QuimbayaEVAL', pageWidth / 2, y, { align: 'center' });
      y += 7;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, y, { align: 'center' });
      if (cursoActual) {
        y += 5;
        pdf.text(`Curso: ${cursoActual.codigo} - ${cursoActual.nombre}`, pageWidth / 2, y, { align: 'center' });
      }
      y += 10;

      if (notasEstudiantes.length > 0) {
        // Tabla notas estudiantes
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Notas por Estudiante', 14, y);
        y += 7;

        pdf.setFillColor(59, 130, 246);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
        pdf.text('Estudiante', 16, y);
        pdf.text('Evaluación', 70, y);
        pdf.text('Nota', 140, y);
        pdf.text('Porcentaje', 158, y);
        y += 6;

        pdf.setTextColor(40, 40, 40);
        notasEstudiantes.forEach((n, i) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          if (i % 2 === 0) {
            pdf.setFillColor(240, 245, 255);
            pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
          }
          pdf.text(n.estudianteNombre.slice(0, 28), 16, y);
          pdf.text(n.evaluacionNombre.slice(0, 30), 70, y);
          pdf.text(`${n.puntuacionTotal}/${n.puntuacionMaxima}`, 140, y);
          pdf.text(`${n.porcentaje.toFixed(1)}%`, 160, y);
          y += 7;
        });
        y += 5;
      }

      if (resumenGrupo.length > 0) {
        if (y > 240) { pdf.addPage(); y = 20; }
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Resumen del Grupo', 14, y);
        y += 7;

        pdf.setFillColor(16, 185, 129);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
        pdf.text('Evaluación', 16, y);
        pdf.text('Promedio', 100, y);
        pdf.text('Aprobados', 125, y);
        pdf.text('Reprobados', 152, y);
        y += 6;

        pdf.setTextColor(40, 40, 40);
        resumenGrupo.forEach((r, i) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          if (i % 2 === 0) {
            pdf.setFillColor(240, 255, 248);
            pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
          }
          pdf.text(r.evaluacionNombre.slice(0, 40), 16, y);
          pdf.text(`${r.promedioEscala.toFixed(1)}`, 102, y);
          pdf.text(String(r.aprobados), 130, y);
          pdf.text(String(r.reprobados), 157, y);
          y += 7;
        });
      }

      pdf.save(`reporte-${cursoActual?.codigo ?? 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF generado', { description: 'Archivo descargado correctamente' });
    } catch {
      toast.error('Error al generar PDF');
    }
  };

  // --- EXPORTAR EXCEL ---
  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      if (notasEstudiantes.length > 0) {
        const wsNotas = XLSX.utils.aoa_to_sheet([
          ['Estudiante', 'Email', 'Evaluación', 'Curso', 'Nota (Escala)', 'Puntuación', 'Máximo', 'Porcentaje'],
          ...notasEstudiantes.map(n => [
            n.estudianteNombre, n.estudianteEmail, n.evaluacionNombre,
            n.cursoNombre, n.notaEscala.toFixed(1), n.puntuacionTotal, n.puntuacionMaxima, `${n.porcentaje.toFixed(1)}%`,
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, wsNotas, 'Notas Estudiantes');
      }

      if (resumenGrupo.length > 0) {
        const wsResumen = XLSX.utils.aoa_to_sheet([
          ['Evaluación', 'Promedio (Escala)', 'Total Estudiantes', 'Aprobados', 'Reprobados'],
          ...resumenGrupo.map(r => [
            r.evaluacionNombre, r.promedioEscala.toFixed(1),
            r.totalEstudiantes, r.aprobados, r.reprobados,
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Grupo');
      }

      // Hoja general siempre
      const wsGeneral = XLSX.utils.aoa_to_sheet([
        ['Reporte QuimbayaEVAL', new Date().toLocaleDateString('es-CO')],
        ['Curso', cursoActual ? `${cursoActual.codigo} - ${cursoActual.nombre}` : 'Todos'],
        [],
        ['Total Cursos', cursosFiltrados.length],
        ['Total Evaluaciones', evaluaciones.length],
        ['Activas', evaluaciones.filter(e => e.estado === 'Activa').length],
        ['Cerradas', evaluaciones.filter(e => e.estado === 'Cerrada').length],
      ]);
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Resumen General');

      XLSX.writeFile(wb, `reporte-${cursoActual?.codigo ?? 'general'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel generado', { description: 'Archivo descargado correctamente' });
    } catch {
      toast.error('Error al generar Excel');
    }
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          {isCoordinador && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Docente</label>
              <Select value={filtroDocente} onValueChange={setFiltroDocente}>
                <SelectTrigger><SelectValue placeholder="Todos los docentes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los docentes</SelectItem>
                  {docentes.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Curso</label>
            <Select value={filtroCursoId} onValueChange={setFiltroCursoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
              <SelectContent>
                {cursosFiltrados.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.codigo} - {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" className="w-full flex items-center gap-2" onClick={() => {
            setFiltroDocente('all');
            setFiltroCursoId('');
            setNotasEstudiantes([]);
            setResumenGrupo([]);
          }}>
            <RefreshCw className="w-4 h-4" /> Limpiar
          </Button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Selecciona un curso para ver las notas detalladas y exportarlas.
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
              <p className="text-gray-500 mt-1 text-sm">
                {cursoActual ? `${cursoActual.codigo} - ${cursoActual.nombre}` : 'Selecciona un curso para ver las notas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleExportarPDF} disabled={!filtroCursoId}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
              <Button className="flex items-center gap-2" onClick={handleExportarExcel} disabled={!filtroCursoId}>
                <FileDown className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando datos..." />
          ) : (
            <div className="space-y-6">
              {/* KPIs generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {estadisticasKPIs.map(stat => <StatCard key={stat.label} stat={stat} />)}
              </div>

              {/* Contenido del curso seleccionado */}
              {!filtroCursoId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>Selecciona un curso en el panel izquierdo para ver las notas.</p>
                  </CardContent>
                </Card>
              ) : loadingNotas ? (
                <LoadingSpinner size="md" text="Cargando notas..." />
              ) : (
                <Tabs defaultValue="notas">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notas">Notas por Estudiante</TabsTrigger>
                    <TabsTrigger value="resumen">Resumen del Grupo</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Notas individuales */}
                  <TabsContent value="notas" className="mt-4">
                    {notasEstudiantes.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center text-gray-400">
                          No hay notas registradas para este curso aún.
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Notas por Estudiante</CardTitle>
                          <CardDescription>
                            {cursoActual?.codigo}
                            {notasEstudiantes[0]?.profesorNombre && ` — Docente: ${notasEstudiantes[0].profesorNombre}`}
                            {` — ${notasEstudiantes.length} registros`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto -mx-6">
                            <div className="inline-block min-w-full px-6">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Evaluación</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Porcentaje</TableHead>                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {notasEstudiantes.map(n => (
                                    <TableRow key={n.id}>
                                      <TableCell>
                                        <div>
                                          <p className="text-gray-900">{n.estudianteNombre}</p>
                                          <p className="text-xs text-gray-500">{n.estudianteEmail}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell>{n.evaluacionNombre}</TableCell>
                                      <TableCell>
                                        <span className="font-medium">{n.notaEscala.toFixed(1)}</span>
                                      </TableCell>
                                      <TableCell>
                                        <span className={n.porcentaje >= 60 ? 'text-green-600' : 'text-red-600'}>
                                          {n.porcentaje.toFixed(1)}%
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* TAB 2: Resumen del grupo */}
                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    {resumenGrupo.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center text-gray-400">
                          No hay datos de resumen para este curso aún.
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* KPIs del grupo */}
                        {promedioGeneral && (
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Promedio General</p>
                                <p className="text-3xl mt-1 text-blue-600">{promedioGeneral}%</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Aprobados</p>
                                <p className="text-3xl mt-1 text-green-600">{totalAprobados}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Reprobados</p>
                                <p className="text-3xl mt-1 text-red-600">{totalReprobados}</p>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* Gráfica promedio por evaluación */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Promedio por Evaluación</CardTitle>
                            <CardDescription>Desempeño del grupo en cada evaluación</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={resumenGrupo}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="evaluacionNombre" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                <Bar dataKey="promedioEscala" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Promedio" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Tabla resumen */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Detalle por Evaluación</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto -mx-6">
                              <div className="inline-block min-w-full px-6">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Evaluación</TableHead>
                                      <TableHead>Promedio</TableHead>
                                      <TableHead>Total</TableHead>
                                      <TableHead>Aprobados</TableHead>
                                      <TableHead>Reprobados</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {resumenGrupo.map(r => (
                                      <TableRow key={r.evaluacionId}>
                                        <TableCell>{r.evaluacionNombre}</TableCell>
                                        <TableCell>
                                          <span className={r.promedioEscala >= 3 ? 'text-green-600' : 'text-red-600'}>
                                            {r.promedioEscala.toFixed(1)}
                                          </span>
                                        </TableCell>
                                        <TableCell>{r.totalEstudiantes}</TableCell>
                                        <TableCell><span className="text-green-600">{r.aprobados}</span></TableCell>
                                        <TableCell><span className="text-red-600">{r.reprobados}</span></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
