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
  { border: 'border-blue-400',    bg: 'bg-blue-50',    icon: 'text-blue-600',    iconBg: 'bg-blue-100'    },
  { border: 'border-emerald-400', bg: 'bg-emerald-50', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  { border: 'border-violet-400',  bg: 'bg-violet-50',  icon: 'text-violet-600',  iconBg: 'bg-violet-100'  },
  { border: 'border-amber-400',   bg: 'bg-amber-50',   icon: 'text-amber-600',   iconBg: 'bg-amber-100'   },
  { border: 'border-rose-400',    bg: 'bg-rose-50',    icon: 'text-rose-600',    iconBg: 'bg-rose-100'    },
  { border: 'border-teal-400',    bg: 'bg-teal-50',    icon: 'text-teal-600',    iconBg: 'bg-teal-100'    },
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
  const totalPendientes = Object.values(pendientesPorCurso).reduce((a, b) => a + b, 0);

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout breadcrumbs={[{ label: 'Inicio' }]}>
        <div className="max-w-4xl mx-auto py-2 space-y-6">

          {/* Saludo */}
          <div>
            <p className="text-sm text-gray-400">{saludo},</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
              Bienvenido, {firstName} 👋
            </h1>
            <p className="text-gray-500 mt-3 text-sm">
              Tienes <span className="font-semibold text-gray-700">{cursos.length}</span> curso{cursos.length !== 1 ? 's' : ''} asignado{cursos.length !== 1 ? 's' : ''}
              {totalPendientes > 0 && (
                <> y <span className="font-semibold text-orange-600">{totalPendientes} evaluación{totalPendientes !== 1 ? 'es' : ''} por calificar</span></>
              )}
              {metricasPQRS.pendientes.length > 0 && (
                <>, además de <span className="font-semibold text-amber-600">{metricasPQRS.pendientes.length} PQRS de aprendices en trámite</span></>
              )}
            </p>
          </div>

          {/* Métricas Rápidas del Instructor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border border-gray-200 shadow-2xs">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Cursos Asignados</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{cursos.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border shadow-2xs ${totalPendientes > 0 ? 'border-orange-300 bg-orange-50/20' : 'border-gray-200'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Por Calificar</p>
                    <p className={`text-2xl font-bold mt-0.5 ${totalPendientes > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {totalPendientes}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${totalPendientes > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border shadow-2xs ${metricasPQRS.pendientes.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">PQRS en Trámite</p>
                    <p className={`text-2xl font-bold mt-0.5 ${metricasPQRS.vencidas.length > 0 ? 'text-red-600' : metricasPQRS.pendientes.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {metricasPQRS.pendientes.length}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${metricasPQRS.urgentes.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-2xs">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">SLA PQRS (15d)</p>
                    <p className={`text-2xl font-bold mt-0.5 ${metricasPQRS.vencidas.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {metricasPQRS.cumplimientoPct}%
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${metricasPQRS.vencidas.length > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget de Evaluaciones Pendientes de Calificación (HCI: Acceso Rápido) */}
          {evaluacionesPorCalificar.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Evaluaciones listas para calificar
                    </h2>
                    <p className="text-xs text-gray-500">
                      Hay {evaluacionesPorCalificar.length} evaluación{evaluacionesPorCalificar.length > 1 ? 'es' : ''} cerrada{evaluacionesPorCalificar.length > 1 ? 's' : ''} con entregas de estudiantes pendientes de revisión
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {evaluacionesPorCalificar.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-xl p-3.5 border border-orange-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-orange-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{ev.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{ev.cursoNombre}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-3 gap-1.5 flex-shrink-0"
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
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 rounded-xl text-teal-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    PQRS y Requerimientos de Aprendices
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      SLA Ley 1755 / 15 Días
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Monitorea las peticiones, dudas y reclamos asignados a tus cursos formativos
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={() => navigate(ROUTES.PQRS)}
              >
                Gestionar en PQRS
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {loadingPqrs ? (
              <div className="h-20 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
                Cargando estado de requerimientos...
              </div>
            ) : metricasPQRS.urgentes.length > 0 ? (
              /* Alerta Prioritaria: Tickets con término perentorio próximo o vencido */
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-red-800 font-semibold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>
                      Atención Requerida: {metricasPQRS.urgentes.length} solicitud(es) tienen el plazo perentorio legal comprometido
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                    Término legal: 15 días hábiles
                  </span>
                </div>

                <div className="divide-y divide-red-200 rounded-xl overflow-hidden border border-red-200 bg-white">
                  {metricasPQRS.urgentes.slice(0, 3).map(ticket => (
                    <div key={ticket.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            #{ticket.id} · {ticket.asunto}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                            {ticket.tipo}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.estadoSLA === 'VENCIDO'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {ticket.estadoSLA === 'VENCIDO'
                              ? `Vencido (${ticket.diasTranscurridos} días)`
                              : `Por vencer (${ticket.diasTranscurridos}/15 días)`}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs truncate">
                          Aprendiz: <span className="font-medium text-gray-700">{ticket.usuarioNombre || 'Aprendiz SENA'}</span>
                          {ticket.cursoNombre && <> · Curso: <span className="font-medium text-gray-700">{ticket.cursoNombre}</span></>}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3 gap-1.5 flex-shrink-0 self-start sm:self-auto"
                        onClick={() => navigate(ROUTES.PQRS)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Responder Requerimiento
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : metricasPQRS.pendientes.length > 0 ? (
              /* Solicitudes pendientes a tiempo */
              <div className="space-y-2">
                <div className="divide-y divide-gray-100 rounded-xl overflow-hidden border border-gray-200 bg-white">
                  {metricasPQRS.pendientes.slice(0, 3).map(ticket => (
                    <div key={ticket.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            #{ticket.id} · {ticket.asunto}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                            {ticket.tipo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            A tiempo ({ticket.diasTranscurridos}/15 días)
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs truncate">
                          Aprendiz: <span className="font-medium text-gray-700">{ticket.usuarioNombre || 'Aprendiz SENA'}</span>
                          {ticket.cursoNombre && <> · Curso: <span className="font-medium text-gray-700">{ticket.cursoNombre}</span></>}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-3 gap-1.5 flex-shrink-0 self-start sm:self-auto hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                        onClick={() => navigate(ROUTES.PQRS)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Atender
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Sin pendientes - Estado óptimo */
              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">
                    ¡Excelente! No tienes PQRS ni requerimientos pendientes por atender.
                  </p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    Todos los requerimientos de tus aprendices se encuentran al día dentro del plazo institucional de 15 días hábiles.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grid de cursos */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900">
              Mis Cursos y Fichas Formativas
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
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
                  const esUltimaImpar = cursos.length % 3 === 1 && idx === cursos.length - 1;
                  return (
                    <button
                      key={curso.id}
                      onClick={() => navigate(`/mis-cursos-maestro/${curso.id}`)}
                      className={`
                        text-left border-t-4 ${c.border} ${c.bg}
                        rounded-2xl p-5 shadow-sm
                        hover:shadow-lg hover:-translate-y-1
                        active:scale-95
                        transition-all duration-200 group
                        flex flex-col gap-4
                        ${esUltimaImpar ? 'sm:col-start-1 lg:col-start-2' : ''}
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
                        <p className="text-[10px] font-mono text-gray-400 leading-none mb-2 uppercase tracking-wide">{curso.codigo}</p>
                        <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{curso.nombre}</p>
                        {curso.descripcion && (
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{curso.descripcion}</p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className={`
                        flex items-center justify-center gap-2
                        text-xs font-semibold ${c.icon}
                        border-2 ${c.border} rounded-xl
                        py-2.5 px-4
                        group-hover:bg-white/70 transition-colors
                      `}>
                        Gestionar curso
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
