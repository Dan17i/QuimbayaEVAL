import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users, BarChart3, TrendingUp, FileDown, BookOpen,
  AlertTriangle, CheckCircle, MessageSquare, TrendingDown,
  GraduationCap, ShieldAlert,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { pqrsService, PQRSDetalle } from '../services/pqrsService';
import { usersService, UserDTO } from '../services/usersService';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Paletas semánticas por tema — desaturadas en oscuro para no "brillar"
const CHART_COLORS = {
  light: { approved: '#22c55e', rejected: '#ef4444', bar: '#3b82f6' },
  dark:  { approved: '#34d399', rejected: '#f87171', bar: '#60a5fa' },
};

const AXIS_COLOR = { light: '#6b7280', dark: 'rgba(255,255,255,0.45)' };
const GRID_COLOR = { light: '#e5e7eb', dark: 'rgba(255,255,255,0.06)' };
const TOOLTIP_STYLE = {
  light: { backgroundColor: '#fff',     border: '1px solid #e5e7eb', color: '#111827' },
  dark:  { backgroundColor: '#21253a',  border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.87)' },
};

export const DashboardCoordinador: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const colors = CHART_COLORS[theme];
  const axisColor = AXIS_COLOR[theme];
  const gridColor = GRID_COLOR[theme];
  const tooltipStyle = TOOLTIP_STYLE[theme];
  const pieColors = [colors.approved, colors.rejected];

  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();

  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(false);

  // Estados para PQRS con SLA y Usuarios Globales
  const [pqrsDetalles, setPqrsDetalles] = useState<PQRSDetalle[]>([]);
  const [loadingPqrs, setLoadingPqrs] = useState(true);
  const [usuarios, setUsuarios] = useState<UserDTO[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const loading = loadingEvals || loadingCursos || loadingUsuarios;

  // Cargar resultados de todos los cursos para analítica global
  useEffect(() => {
    if (cursos.length === 0) return;
    const cargar = async () => {
      setLoadingResultados(true);
      try {
        const todos = await Promise.all(
          cursos.map(c => resultadosService.getByCurso(c.id).catch(() => [] as ResultadoDetalle[]))
        );
        setResultados(todos.flat());
      } finally {
        setLoadingResultados(false);
      }
    };
    cargar();
  }, [cursos.length]);

  // Cargar PQRS enriquecidas con SLA
  useEffect(() => {
    pqrsService.getDetalles()
      .then(setPqrsDetalles)
      .catch(() => setPqrsDetalles([]))
      .finally(() => setLoadingPqrs(false));
  }, []);

  // Cargar Usuarios globales para KPIs institucionales
  useEffect(() => {
    usersService.getAll()
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
      .finally(() => setLoadingUsuarios(false));
  }, []);

  // ── Métricas de usuarios institucionales ─────────────────────────
  const totalEstudiantes = useMemo(() => usuarios.filter(u => u.role === 'estudiante').length, [usuarios]);
  const totalDocentes = useMemo(() => usuarios.filter(u => u.role === 'maestro').length, [usuarios]);

  // ── Métricas de PQRS y SLA Institucional (15 Días) ───────────────
  const metricasPQRS = useMemo(() => {
    const total = pqrsDetalles.length;
    const pendientes = pqrsDetalles.filter(p => p.estado === 'Pendiente' || p.estado === 'En Proceso');
    const vencidas = pqrsDetalles.filter(p => p.estadoSLA === 'VENCIDO');
    const proximas = pqrsDetalles.filter(p => p.estadoSLA === 'PROXIMO_A_VENCER');
    const atendidas = pqrsDetalles.filter(p => p.estado === 'Resuelta' || p.estado === 'Cerrada');
    const atendidasATiempo = pqrsDetalles.filter(p => p.estadoSLA === 'ATENDIDO_A_TIEMPO');
    
    const cumplimientoPct = total > 0
      ? Math.round(((total - vencidas.length) / total) * 100)
      : 100;

    const urgentes = [...vencidas, ...proximas];

    return {
      total,
      pendientes,
      vencidas,
      proximas,
      atendidas,
      atendidasATiempo,
      cumplimientoPct,
      urgentes,
    };
  }, [pqrsDetalles]);

  // ── Métricas globales de notas ───────────────────────────────────
  const metricas = useMemo(() => {
    const total = resultados.length;
    if (total === 0) return null;
    const aprobados = resultados.filter(r => r.estadoAprobacion === 'Aprobado').length;
    const reprobados = total - aprobados;
    const notas = resultados.map(r => r.notaEscala ?? r.porcentaje / 20);
    const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
    return {
      total,
      aprobados,
      reprobados,
      pctAprobacion: ((aprobados / total) * 100).toFixed(0),
      promedio: promedio.toFixed(2),
    };
  }, [resultados]);

  // ── Evaluaciones por curso (gráfica de barras) ───────────────────
  const evalsPorCurso = useMemo(() =>
    cursos.slice(0, 8).map(c => ({
      curso: c.codigo,
      evaluaciones: evaluaciones.filter(e => e.cursoId === c.id).length,
    })).filter(d => d.evaluaciones > 0),
    [cursos, evaluaciones]
  );

  // ── Aprobación por curso (gráfica de barras apiladas) ────────────
  const aprobacionPorCurso = useMemo(() => {
    return cursos.slice(0, 8).map(c => {
      const res = resultados.filter(r => r.cursoId === c.id || r.cursoNombre === c.nombre);
      const aprobados = res.filter(r => r.estadoAprobacion === 'Aprobado').length;
      const reprobados = res.filter(r => r.estadoAprobacion === 'Reprobado').length;
      return { curso: c.codigo, aprobados, reprobados };
    }).filter(d => d.aprobados + d.reprobados > 0);
  }, [cursos, resultados]);

  // ── Torta global aprobados/reprobados ────────────────────────────
  const pieData = metricas
    ? [
        { name: 'Aprobados', value: metricas.aprobados },
        { name: 'Reprobados', value: metricas.reprobados },
      ]
    : [];

  const evaluacionesActivas = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Activa'), [evaluaciones]
  );

  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="p-4 sm:p-6 md:p-10 space-y-8 w-full max-w-7xl mx-auto">

          {/* Header Institucional */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-gray-900 dark:text-white text-xl font-bold">Panel de Coordinación Académica</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Indicadores institucionales, trazabilidad de evaluaciones y cumplimiento legal SENA</p>
            </div>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm w-full sm:w-auto"
              onClick={() => navigate('/reportes')}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>

          {/* KPIs Operativos Institucionales */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/50">Cursos Activos</p>
                        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{cursos.length}</p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/50">Estudiantes</p>
                        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{totalEstudiantes}</p>
                      </div>
                      <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-lg flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/50">Instructores</p>
                        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{totalDocentes}</p>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-lg flex-shrink-0">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/50">Pruebas Activas</p>
                        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{evaluacionesActivas.length}</p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-lg flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={metricasPQRS.urgentes.length > 0 ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20' : ''}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/50">SLA PQRS (15d)</p>
                        <p className={`text-3xl font-bold mt-1 ${metricasPQRS.vencidas.length > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {metricasPQRS.cumplimientoPct}%
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                        metricasPQRS.urgentes.length > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-teal-100 dark:bg-teal-900/40'
                      }`}>
                        <MessageSquare className={`w-5 h-5 ${metricasPQRS.urgentes.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* ── Módulo de Auditoría y Cumplimiento Legal PQRS (SLA 15 Días) ── */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/60 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Auditoría de PQRS y Cumplimiento Legal (SLA 15 Días)
                </CardTitle>
                <CardDescription>
                  Monitoreo de tiempos de respuesta a peticiones y reclamos según el marco legal y directivas SENA.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pqrs')}
                className="text-xs self-start sm:self-auto"
              >
                Gestionar en PQRS
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Micro-cards SLA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Radicadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metricasPQRS.total}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">En Trámite</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{metricasPQRS.pendientes.length}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${
                  metricasPQRS.proximas.length > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500'
                }`}>
                  <p className="text-xs">Próximas a Vencer</p>
                  <p className="text-2xl font-bold mt-1">{metricasPQRS.proximas.length}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${
                  metricasPQRS.vencidas.length > 0
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                    : 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                }`}>
                  <p className="text-xs">{metricasPQRS.vencidas.length > 0 ? 'Vencidas (>15d)' : 'Sin Vencimientos'}</p>
                  <p className="text-2xl font-bold mt-1">{metricasPQRS.vencidas.length}</p>
                </div>
              </div>

              {/* Alerta de urgencia o confirmación de cumplimiento */}
              {metricasPQRS.urgentes.length > 0 ? (
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Atención Requerida: {metricasPQRS.urgentes.length} solicitud(es) tienen el plazo legal de respuesta comprometido</span>
                  </div>
                  <div className="divide-y divide-red-200 dark:divide-red-900/40 rounded-lg overflow-hidden border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-900">
                    {metricasPQRS.urgentes.slice(0, 4).map(ticket => (
                      <div key={ticket.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                              #{ticket.id} · {ticket.asunto}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.estadoSLA === 'VENCIDO'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                            }`}>
                              {ticket.estadoSLA === 'VENCIDO'
                                ? `Vencido (${ticket.diasTranscurridos} días)`
                                : `Por vencer (${ticket.diasTranscurridos}/15 días)`}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                            Remitente: {ticket.usuarioNombre || 'Anónimo'} {ticket.cursoCodigo ? `· Curso: ${ticket.cursoCodigo}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 self-end sm:self-auto border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => navigate('/pqrs')}
                        >
                          Atender Ticket
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-green-200 dark:border-green-900/60 bg-green-50/70 dark:bg-green-950/30 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-green-800 dark:text-green-300">
                      100% de Cumplimiento del SLA Institucional (15 Días)
                    </p>
                    <p className="text-green-700/80 dark:text-green-400/80">
                      Todas las PQRS radicadas se encuentran resueltas o dentro del tiempo de respuesta legal.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analítica global de desempeño */}
          {loadingResultados ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : metricas && (
            <>
              {/* KPIs de desempeño */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide mb-3 mt-2">
                  Desempeño institucional
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-evenly">
                  <Card className="border-green-200 dark:border-green-900/50">
                    <CardContent className="pt-5 pb-5 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{metricas.pctAprobacion}%</p>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Tasa de aprobación</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 dark:border-blue-900/50">
                    <CardContent className="pt-5 pb-5 text-center">
                      <TrendingUp className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{metricas.promedio}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Promedio institucional</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200 dark:border-emerald-900/50">
                    <CardContent className="pt-5 pb-5 text-center">
                      <Users className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{metricas.aprobados}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Evaluaciones aprobadas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 dark:border-red-900/50">
                    <CardContent className="pt-5 pb-5 text-center">
                      <TrendingDown className="w-6 h-6 text-red-500 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metricas.reprobados}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Evaluaciones reprobadas</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Torta aprobados/reprobados */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Aprobación global</CardTitle>
                    <CardDescription>Distribución institucional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={pieColors[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [`${value} resultados`, name]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={10}
                          formatter={(value, entry: any) => (
                            <span style={{ color: axisColor, fontSize: 12 }}>
                              {value} ({entry.payload.value})
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-xs text-gray-500 dark:text-white/50 -mt-2">
                      {metricas?.pctAprobacion}% aprobación
                    </p>
                  </CardContent>
                </Card>

                {/* Barras aprobación por curso */}
                {aprobacionPorCurso.length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Aprobación por curso</CardTitle>
                      <CardDescription>Aprobados vs reprobados por materia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={aprobacionPorCurso}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="curso" tick={{ fontSize: 11, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend formatter={(v) => <span style={{ color: axisColor, fontSize: 12 }}>{v}</span>} />
                          <Bar dataKey="aprobados" name="Aprobados" fill={colors.approved} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="reprobados" name="Reprobados" fill={colors.rejected} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Evaluaciones por curso */}
          {!loading && evalsPorCurso.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actividad evaluativa por curso</CardTitle>
                <CardDescription>Cantidad de evaluaciones registradas por materia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={evalsPorCurso}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="curso" tick={{ fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="evaluaciones" name="Evaluaciones" fill={colors.bar} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer" onClick={() => navigate('/reportes')}>
              <CardHeader>
                <div className="bg-blue-100 dark:bg-blue-900/40 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base">Reportes</CardTitle>
                <CardDescription>KPIs y exportación PDF/XLSX</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer" onClick={() => navigate('/usuarios')}>
              <CardHeader>
                <div className="bg-green-100 dark:bg-green-900/40 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-base">Usuarios</CardTitle>
                <CardDescription>Roles, cuentas y permisos</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer" onClick={() => navigate('/cursos')}>
              <CardHeader>
                <div className="bg-indigo-100 dark:bg-indigo-900/40 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-base">Cursos</CardTitle>
                <CardDescription>Docentes y matrículas</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer" onClick={() => navigate('/pqrs')}>
              <CardHeader>
                <div className="bg-orange-100 dark:bg-orange-900/40 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-base">PQRS</CardTitle>
                <CardDescription>Peticiones y reclamos</CardDescription>
              </CardHeader>
            </Card>
          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
