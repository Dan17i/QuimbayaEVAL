import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Plus, Clock, CheckCircle, AlertCircle, BarChart3,
  ClipboardList, Users, ChevronRight, BookOpen,
  FileSpreadsheet, FileText, Filter,
} from 'lucide-react';
import { cursosService, Curso } from '../services/cursosService';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

export const CursoMaestroPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cursoId = Number(id);

  const [curso, setCurso] = useState<Curso | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [loadingCurso, setLoadingCurso] = useState(true);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);

  // Filtros del reporte
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Aprobado' | 'Reprobado'>('todos');
  const [filtroEvaluacion, setFiltroEvaluacion] = useState<string>('todas');

  useEffect(() => {
    if (!cursoId) return;
    cursosService.getById(cursoId)
      .then(setCurso)
      .catch(() => toast.error('No se pudo cargar el curso'))
      .finally(() => setLoadingCurso(false));

    evaluacionesService.getByCurso(cursoId)
      .then(setEvaluaciones)
      .catch(() => toast.error('No se pudieron cargar las evaluaciones'))
      .finally(() => setLoadingEvals(false));
  }, [cursoId]);

  const handleVerReporte = async () => {
    if (mostrarReporte) { setMostrarReporte(false); return; }
    setLoadingReporte(true);
    try {
      const data = await resultadosService.getByCurso(cursoId);
      setResultados(data);
      setMostrarReporte(true);
    } catch {
      toast.error('No se pudo cargar el reporte de notas');
    } finally {
      setLoadingReporte(false);
    }
  };

  // Resultados filtrados
  const resultadosFiltrados = useMemo(() => {
    return resultados.filter(r => {
      const passEstado = filtroEstado === 'todos' || r.estadoAprobacion === filtroEstado;
      const passEval = filtroEvaluacion === 'todas' || r.evaluacionNombre === filtroEvaluacion;
      return passEstado && passEval;
    });
  }, [resultados, filtroEstado, filtroEvaluacion]);

  // Lista única de evaluaciones para el filtro
  const evalNombres = useMemo(() =>
    Array.from(new Set(resultados.map(r => r.evaluacionNombre))),
    [resultados]
  );

  // Estadísticas del reporte filtrado
  const stats = useMemo(() => {
    if (!resultadosFiltrados.length) return null;
    const notas = resultadosFiltrados.map(r => r.notaEscala ?? r.porcentaje / 20);
    const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
    const aprobados = resultadosFiltrados.filter(r => r.estadoAprobacion === 'Aprobado').length;
    return {
      promedio: promedio.toFixed(2),
      pctAprobacion: ((aprobados / resultadosFiltrados.length) * 100).toFixed(0),
      total: resultadosFiltrados.length,
      aprobados,
    };
  }, [resultadosFiltrados]);

  const metadatos = {
    curso: curso?.nombre ?? '',
    cursoId: cursoId,
    docente: user?.name ?? '',
    fecha: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  // ── Exportar Excel ──────────────────────────────────────────────
  const exportarExcel = () => {
    if (!resultadosFiltrados.length) { toast.error('No hay datos para exportar'); return; }

    const encabezado = [
      [`Reporte de Notas — ${metadatos.curso}`],
      [`ID Curso: ${metadatos.cursoId}   |   Docente: ${metadatos.docente}   |   Fecha: ${metadatos.fecha}`],
      [],
      ['ID Estudiante', 'Nombre', 'Email', 'Evaluación', 'Puntaje', 'Puntaje Máx.', 'Porcentaje (%)', 'Nota (escala)', 'Estado'],
    ];

    const filas = resultadosFiltrados.map(r => [
      r.estudianteId ?? '',
      r.estudianteNombre,
      r.estudianteEmail,
      r.evaluacionNombre,
      r.puntuacionTotal,
      r.puntuacionMaxima,
      r.porcentaje,
      r.notaEscala ?? '',
      r.estadoAprobacion,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...filas]);
    ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 32 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 13 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${curso?.codigo ?? cursoId}_${Date.now()}.xlsx`);
    toast.success('Excel descargado');
  };

  // ── Exportar PDF ────────────────────────────────────────────────
  const exportarPDF = () => {
    if (!resultadosFiltrados.length) { toast.error('No hay datos para exportar'); return; }

    const doc = new jsPDF({ orientation: 'landscape' });

    // Encabezado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporte de Notas — ${metadatos.curso}`, 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`ID Curso: ${metadatos.cursoId}   |   Docente: ${metadatos.docente}   |   Fecha: ${metadatos.fecha}`, 14, 23);

    // Resumen estadístico
    if (stats) {
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen estadístico', 14, 32);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Promedio del curso: ${stats.promedio}   |   % Aprobación: ${stats.pctAprobacion}%   |   Total registros: ${stats.total}   |   Aprobados: ${stats.aprobados}`, 14, 38);
    }

    // Tabla
    autoTable(doc, {
      startY: 44,
      head: [['ID Estudiante', 'Nombre', 'Email', 'Evaluación', 'Nota', 'Estado']],
      body: resultadosFiltrados.map(r => [
        r.estudianteId ?? '—',
        r.estudianteNombre,
        r.estudianteEmail,
        r.evaluacionNombre,
        r.notaEscala?.toFixed(1) ?? `${r.porcentaje.toFixed(0)}%`,
        r.estadoAprobacion,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = String(data.cell.raw);
          data.cell.styles.textColor = val === 'Aprobado' ? [22, 163, 74] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    doc.save(`reporte_${curso?.codigo ?? cursoId}_${Date.now()}.pdf`);
    toast.success('PDF descargado');
  };

  const activas    = evaluaciones.filter(e => e.estado === 'Activa' || e.estado === 'Programada');
  const porCalificar = evaluaciones.filter(e => e.estado === 'Cerrada');

  const estadoBadge = (estado: Evaluacion['estado']) => {
    const map = {
      Activa:     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs"><Clock className="w-3 h-3" /> Activa</span>,
      Programada: <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs"><Clock className="w-3 h-3" /> Programada</span>,
      Cerrada:    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs"><CheckCircle className="w-3 h-3" /> Cerrada</span>,
      Borrador:   <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"><AlertCircle className="w-3 h-3" /> Borrador</span>,
    };
    return map[estado] ?? null;
  };

  const EvalCard = ({ eval: e }: { eval: Evaluacion }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 truncate">{e.nombre}</p>
          {estadoBadge(e.estado)}
        </div>
        <p className="text-xs text-gray-500">
          {e.tipo} · {e.deadline ? `Cierre: ${formatDate(e.deadline)}` : 'Sin fecha límite'}
        </p>
      </div>
      {e.estado === 'Cerrada' && (
        <Button size="sm" onClick={() => navigate(`${ROUTES.CALIFICAR}?evaluacionId=${e.id}`)}>
          <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Calificar
        </Button>
      )}
      {e.estado === 'Borrador' && (
        <Button size="sm" variant="outline">Editar</Button>
      )}
    </div>
  );

  if (loadingCurso) {
    return (
      <ProtectedRoute allowedRoles={['maestro']}>
        <Layout breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: '...' }]}>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: curso?.nombre ?? 'Curso' },
        ]}
      >
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header del curso */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">{curso?.codigo}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{curso?.nombre}</h1>
              {curso?.descripcion && (
                <p className="text-sm text-gray-500 mt-1">{curso.descripcion}</p>
              )}
            </div>
            <Button
              className="flex items-center gap-2 flex-shrink-0"
              onClick={() => navigate(`${ROUTES.CREAR_EVALUACION}?cursoId=${cursoId}`)}
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Button>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{activas.length}</p>
              <p className="text-xs text-green-600 mt-1">Activas / Programadas</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">{porCalificar.length}</p>
              <p className="text-xs text-orange-600 mt-1">Por calificar</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-blue-700">{evaluaciones.length}</p>
              <p className="text-xs text-blue-600 mt-1">Total evaluaciones</p>
            </div>
          </div>

          {/* Tabs de evaluaciones */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                Evaluaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingEvals ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="activas">
                  <TabsList className="mb-4">
                    <TabsTrigger value="activas">
                      Activas
                      {activas.length > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                          {activas.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="calificar">
                      Por Calificar
                      {porCalificar.length > 0 && (
                        <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                          {porCalificar.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="activas">
                    {activas.length === 0 ? (
                      <EmptyState
                        icon={Clock}
                        title="Sin evaluaciones activas"
                        description="Crea una nueva evaluación para este curso."
                        actionLabel="Nueva Evaluación"
                        onAction={() => navigate(`${ROUTES.CREAR_EVALUACION}?cursoId=${cursoId}`)}
                      />
                    ) : (
                      <div className="space-y-3">
                        {activas.map(e => <EvalCard key={e.id} eval={e} />)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="calificar">
                    {porCalificar.length === 0 ? (
                      <EmptyState
                        icon={CheckCircle}
                        title="Todo al día"
                        description="No hay evaluaciones pendientes de calificación."
                      />
                    ) : (
                      <div className="space-y-3">
                        {porCalificar.map(e => <EvalCard key={e.id} eval={e} />)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Reporte de notas */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  Reporte de Notas
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {mostrarReporte && (
                    <>
                      <Button variant="outline" size="sm" onClick={exportarExcel} className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportarPDF} className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-red-500" />
                        PDF
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={handleVerReporte} disabled={loadingReporte}>
                    {loadingReporte ? 'Cargando...' : mostrarReporte ? 'Ocultar' : 'Ver reporte'}
                    {!loadingReporte && !mostrarReporte && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {mostrarReporte && (
              <CardContent className="space-y-4">
                {resultados.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Sin resultados aún"
                    description="Cuando los estudiantes completen evaluaciones, sus notas aparecerán aquí."
                  />
                ) : (
                  <>
                    {/* Resumen estadístico */}
                    {stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-blue-700">{stats.promedio}</p>
                          <p className="text-xs text-blue-600 mt-0.5">Promedio</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-green-700">{stats.pctAprobacion}%</p>
                          <p className="text-xs text-green-600 mt-0.5">Aprobación</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-gray-700">{stats.aprobados}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Aprobados</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-red-700">{stats.total - stats.aprobados}</p>
                          <p className="text-xs text-red-500 mt-0.5">Reprobados</p>
                        </div>
                      </div>
                    )}

                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los estados</SelectItem>
                          <SelectItem value="Aprobado">Solo aprobados</SelectItem>
                          <SelectItem value="Reprobado">Solo reprobados</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filtroEvaluacion} onValueChange={setFiltroEvaluacion}>
                        <SelectTrigger className="w-52 h-8 text-xs">
                          <SelectValue placeholder="Evaluación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas las evaluaciones</SelectItem>
                          {evalNombres.map(n => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(filtroEstado !== 'todos' || filtroEvaluacion !== 'todas') && (
                        <button
                          onClick={() => { setFiltroEstado('todos'); setFiltroEvaluacion('todas'); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                      <span className="ml-auto text-xs text-gray-400">{resultadosFiltrados.length} registro{resultadosFiltrados.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Tabla */}
                    {resultadosFiltrados.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">No hay resultados con los filtros aplicados.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-700 text-white">
                              <th className="text-left py-2.5 px-4 font-medium">Estudiante</th>
                              <th className="text-left py-2.5 px-4 font-medium">Evaluación</th>
                              <th className="text-center py-2.5 px-4 font-medium">Nota</th>
                              <th className="text-center py-2.5 px-4 font-medium">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadosFiltrados.map((r, idx) => {
                              const aprobado = r.estadoAprobacion === 'Aprobado';
                              return (
                                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-gray-900">{r.estudianteNombre}</p>
                                    <p className="text-xs text-gray-400">{r.estudianteEmail}</p>
                                  </td>
                                  <td className="py-3 px-4 text-gray-700">{r.evaluacionNombre}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`font-bold text-base ${aprobado ? 'text-green-600' : 'text-red-600'}`}>
                                      {r.notaEscala?.toFixed(1) ?? r.porcentaje.toFixed(0) + '%'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      aprobado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {r.estadoAprobacion}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            )}
          </Card>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
