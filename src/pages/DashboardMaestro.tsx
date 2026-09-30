import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import {
  BookOpen, ChevronRight, AlertCircle,
  Calculator, Code2, FlaskConical, Database, Globe,
  Music, Palette, Dumbbell, Landmark, Microscope, ClipboardList,
  Clock, ArrowRight,
} from 'lucide-react';
import { cursosService, Curso } from '../services/cursosService';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
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
  const [loading, setLoading] = useState(true);

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
            </p>
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

          {/* Grid de cursos */}
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
      </Layout>
    </ProtectedRoute>
  );
};
