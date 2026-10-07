import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  BookOpen, ChevronRight, AlertCircle,
  Calculator, Code2, FlaskConical, Database, Globe,
  Music, Palette, Dumbbell, Landmark, Microscope, ClipboardList,
  Clock, ArrowRight, MessageSquare, ShieldAlert, AlertTriangle,
  CheckCircle2, Send, Users
} from 'lucide-react';
import { cursosService, Curso } from '../services/cursosService';
import { evaluacionesService } from '../services/evaluacionesService';
import { pqrsService, PQRSDetalle } from '../services/pqrsService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';

const CARD_COLORS = [
  { border: 'border-sky-500',    icon: 'text-sky-400',    iconBg: 'bg-sky-100 dark:bg-sky-950/60'    },
  { border: 'border-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-950/60' },
  { border: 'border-violet-500',  icon: 'text-violet-600 dark:text-violet-400',  iconBg: 'bg-violet-100 dark:bg-violet-950/60'  },
  { border: 'border-amber-500',   icon: 'text-amber-600 dark:text-amber-400',   iconBg: 'bg-amber-100 dark:bg-amber-950/60'   },
  { border: 'border-rose-500',    icon: 'text-rose-600 dark:text-rose-400',    iconBg: 'bg-rose-100 dark:bg-rose-950/60'    },
  { border: 'border-teal-500',    icon: 'text-teal-600 dark:text-teal-400',    iconBg: 'bg-teal-100 dark:bg-teal-950/60'    },
];

function iconoPorCodigo(codigo: string) {
  const c = codigo.toUpperCase();
  if (c.startsWith('MAT') || c.startsWith('CALC') || c.startsWith('EST')) return Calculator;
  if (c.startsWith('BD') || c.startsWith('DAT') || c.startsWith('DB'))   return Database;
  if (c.startsWith('PROG') || c.startsWith('SIS') || c.startsWith('WEB') || c.startsWith('INF')) return Code2;
  if (c.startsWith('FIS') || c.startsWith('QUI') || c.startsWith('BIO')) return FlaskConical;
  if (c.startsWith('ING') || c.startsWith('LEN') || c.startsWith('ESP')) return Globe;
  if (c.startsWith('MUS') || c.startsWith('ART'))  return Music;
  if (c.startsWith('DIS') || c.startsWith('GRA'))  return Palette;
  if (c.startsWith('EDF') || c.startsWith('DEP'))  return Dumbbell;
  if (c.startsWith('HIS') || c.startsWith('SOC') || c.startsWith('POL')) return Landmark;
  if (c.startsWith('MED') || c.startsWith('SAL'))  return Microscope;
  return BookOpen;
}

function esNombreFemenino(nombre: string): boolean {
  if (!nombre) return false;
  const n = nombre.trim().toLowerCase();
  const firstWord = n.split(' ')[0];
  const excepcionesFemeninas = [
    'carmen', 'pilar', 'isabel', 'mercedes', 'raquel', 'inés', 'ines',
    'beatriz', 'esther', 'ester', 'belén', 'belen', 'concepción', 'concepcion',
    'rosario', 'dolores', 'lourdes', 'monserrat', 'montserrat', 'rocío', 'rocio',
    'consuelo', 'amparo', 'luz', 'mar', 'paz', 'sol', 'ana', 'maría', 'maria',
    'profesora', 'docente', 'instructora'
  ];
  if (excepcionesFemeninas.includes(firstWord)) return true;
  const excepcionesMasculinas = ['luca', 'lucas', 'sasha', 'elías', 'elias', 'josué', 'josue', 'borja'];
  if (excepcionesMasculinas.includes(firstWord)) return false;
  return firstWord.endsWith('a');
}

export const DashboardMaestro: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [pendientesPorCurso, setPendientesPorCurso] = useState<Record<number, number>>({});
  const [evaluacionesPorCalificar, setEvaluacionesPorCalificar] = useState<{ id: number; nombre: string; cursoNombre: string; cursoId: number }[]>([]);
  const [pqrsDetalles, setPqrsDetalles] = useState<PQRSDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPqrs, setLoadingPqrs] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const misCursos = await cursosService.getByProfesor(Number(user.id));
        setCursos(misCursos);

        // Para cada curso, contar evaluaciones cerradas (por calificar) y extraer detalles
        const counts: Record<number, number> = {};
        const listaPorCalificar: { id: number; nombre: string; cursoNombre: string; cursoId: number }[] = [];

        await Promise.all(
          misCursos.map(async (curso) => {
            try {
              const evals = await evaluacionesService.getByCurso(curso.id);
              const cerradas = evals.filter(e => e.estado === 'Cerrada');
              counts[curso.id] = cerradas.length;
              cerradas.forEach(e => {
                listaPorCalificar.push({
                  id: e.id,
                  nombre: e.nombre,
                  cursoNombre: curso.nombre,
                  cursoId: curso.id,
                });
              });
            } catch {
              counts[curso.id] = 0;
            }
          })
        );
        setPendientesPorCurso(counts);
        setEvaluacionesPorCalificar(listaPorCalificar);
      } catch (err) {
        toast.error('Error al cargar tus cursos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // Cargar PQRS enriquecidas asignadas a los cursos del instructor
  useEffect(() => {
    pqrsService.getDetalles()
      .then(setPqrsDetalles)
      .catch(() => setPqrsDetalles([]))
      .finally(() => setLoadingPqrs(false));
  }, []);

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

  const saludo = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Profesor';
  const bienvenida = esNombreFemenino(firstName) ? 'Bienvenida' : 'Bienvenido';
  const totalPendientes = Object.values(pendientesPorCurso).reduce((a, b) => a + b, 0);

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout breadcrumbs={[{ label: 'Inicio' }]}>
        <div className="max-w-4xl mx-auto py-2 pb-24 space-y-8">

          {/* Saludo */}
          <div>
            <p className="text-sm text-slate-400 dark:text-slate-400">{saludo},</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {bienvenida}, {firstName} 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
              Tienes <span className="font-semibold text-slate-800 dark:text-slate-200">{cursos.length}</span> curso{cursos.length !== 1 ? 's' : ''} asignado{cursos.length !== 1 ? 's' : ''}
              {totalPendientes > 0 && (
                <> y <span className="font-semibold text-orange-600 dark:text-orange-400">{totalPendientes} evaluación{totalPendientes !== 1 ? 'es' : ''} por calificar</span></>
              )}
              {metricasPQRS.pendientes.length > 0 && (
                <>, además de <span className="font-semibold text-amber-600 dark:text-amber-400">{metricasPQRS.pendientes.length} PQRS de aprendices en trámite</span></>
              )}
            </p>
          </div>

          {/* Métricas Rápidas del Instructor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Cursos Asignados</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{cursos.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-sky-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border shadow-2xs ${totalPendientes > 0 ? 'border-orange-300 dark:border-orange-800 bg-orange-50/20 dark:bg-orange-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Por Calificar</p>
                    <p className={`text-2xl font-bold mt-0.5 ${totalPendientes > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                      {totalPendientes}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${totalPendientes > 0 ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border shadow-2xs ${metricasPQRS.pendientes.length > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">PQRS en Trámite</p>
                    <p className={`text-2xl font-bold mt-0.5 ${metricasPQRS.vencidas.length > 0 ? 'text-red-600 dark:text-red-400' : metricasPQRS.pendientes.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                      {metricasPQRS.pendientes.length}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${metricasPQRS.urgentes.length > 0 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">SLA PQRS (15d)</p>
                    <p className={`text-2xl font-bold mt-0.5 ${metricasPQRS.vencidas.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {metricasPQRS.cumplimientoPct}%
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${metricasPQRS.vencidas.length > 0 ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget de Evaluaciones Pendientes de Calificación (HCI: Acceso Rápido) */}
          {evaluacionesPorCalificar.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30 border border-orange-200 dark:border-orange-900/60 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-950/60 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Evaluaciones listas para calificar
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Hay {evaluacionesPorCalificar.length} evaluación{evaluacionesPorCalificar.length > 1 ? 'es' : ''} cerrada{evaluacionesPorCalificar.length > 1 ? 's' : ''} con entregas de estudiantes pendientes de revisión
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {evaluacionesPorCalificar.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-orange-200 dark:border-orange-900/60 shadow-xs flex items-center justify-between gap-3 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{ev.nombre}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ev.cursoNombre}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-3 gap-1.5 flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`${ROUTES.CALIFICAR}?id=${ev.id}`)}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Calificar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Widget de PQRS y Requerimientos de Aprendices (SLA 15 Días) */}
          <div className="bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 dark:bg-teal-950/60 rounded-xl text-teal-700 dark:text-teal-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    PQRS y Requerimientos de Aprendices
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      SLA Ley 1755 / 15 Días
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Monitorea las peticiones, dudas y reclamos asignados a tus cursos formativos
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => navigate(ROUTES.PQRS)}
              >
                Gestionar en PQRS
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {loadingPqrs ? (
              <div className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                Cargando estado de requerimientos...
              </div>
            ) : metricasPQRS.urgentes.length > 0 ? (
              /* Alerta Prioritaria: Tickets con término perentorio próximo o vencido */
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs sm:text-sm" style={{ color: '#f87171' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" style={{ color: '#f87171' }} />
                    <span className="text-red-400 font-bold" style={{ color: '#f87171' }}>
                      Atención Requerida: {metricasPQRS.urgentes.length} solicitud(es) tienen el plazo perentorio legal comprometido
                    </span>
                  </div>
                  <span
                    className="bg-red-950/80 text-red-300 border border-red-800/60 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ color: '#fca5a5' }}
                  >
                    Término legal: 15 días hábiles
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {metricasPQRS.urgentes.slice(0, 3).map(ticket => (
                    <div
                      key={ticket.id}
                      className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            #{ticket.id} · {ticket.asunto}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {ticket.tipo}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.estadoSLA === 'VENCIDO'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {ticket.estadoSLA === 'VENCIDO'
                              ? `Vencido (${ticket.diasTranscurridos} días)`
                              : `Por vencer (${ticket.diasTranscurridos}/15 días)`}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                          Aprendiz: <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.usuarioNombre || 'Aprendiz SENA'}</span>
                          {ticket.cursoNombre && <> · Curso: <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.cursoNombre}</span></>}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg border border-slate-500 shadow-md inline-flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto transition-all cursor-pointer"
                        style={{ backgroundColor: '#334155', borderColor: '#64748b', color: '#ffffff' }}
                        onClick={() => navigate(ROUTES.PQRS)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Responder Requerimiento
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : metricasPQRS.pendientes.length > 0 ? (
              /* Solicitudes pendientes a tiempo */
              <div className="flex flex-col gap-3">
                {metricasPQRS.pendientes.slice(0, 3).map(ticket => (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          #{ticket.id} · {ticket.asunto}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {ticket.tipo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                          A tiempo ({ticket.diasTranscurridos}/15 días)
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        Aprendiz: <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.usuarioNombre || 'Aprendiz SENA'}</span>
                        {ticket.cursoNombre && <> · Curso: <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.cursoNombre}</span></>}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg border border-slate-500 shadow-md inline-flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto transition-all cursor-pointer"
                      style={{ backgroundColor: '#334155', borderColor: '#64748b', color: '#ffffff' }}
                      onClick={() => navigate(ROUTES.PQRS)}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Atender
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Sin pendientes - Estado óptimo */
              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                    ¡Excelente! No tienes PQRS ni requerimientos pendientes por atender.
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                    Todos los requerimientos de tus aprendices se encuentran al día dentro del plazo institucional de 15 días hábiles.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grid de cursos */}
          <div className="space-y-4 pb-12">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
              Mis Cursos y Fichas Formativas
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Sin cursos asignados"
                description="Aún no tienes cursos asignados. Contacta al coordinador."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cursos.map((curso, idx) => {
                  const porCalificar = pendientesPorCurso[curso.id] ?? 0;
                  const c = CARD_COLORS[idx % CARD_COLORS.length];
                  const Icono = iconoPorCodigo(curso.codigo);
                  return (
                    <button
                      key={curso.id}
                      onClick={() => navigate(`/mis-cursos-maestro/${curso.id}`)}
                      className={`
                        w-full text-left border-t-4 ${c.border}
                        border-x border-b border-slate-200 dark:border-slate-800
                        bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100
                        rounded-2xl p-5 shadow-sm
                        hover:shadow-lg hover:-translate-y-1
                        active:scale-95
                        transition-all duration-200 group
                        flex flex-col justify-between gap-4 cursor-pointer h-full
                      `}
                    >
                      {/* Icono + badge */}
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${c.iconBg}`}>
                          <Icono className={`w-6 h-6 ${c.icon}`} />
                        </div>
                        {porCalificar > 0 && (
                          <span className="flex items-center gap-1 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                            <ClipboardList className="w-3 h-3" />
                            {porCalificar} por calificar
                          </span>
                        )}
                      </div>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400 leading-none mb-2 uppercase tracking-wide">{curso.codigo}</p>
                        <p className="text-slate-900 dark:text-white font-bold text-lg leading-snug line-clamp-2">{curso.nombre}</p>
                        {curso.descripcion && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{curso.descripcion}</p>
                        )}
                      </div>

                      {/* CTA */}
                      <div
                        className="w-full mt-3 py-2 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1 transition-all"
                        style={{ color: '#38bdf8' }}
                      >
                        Gestionar curso
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#38bdf8' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
