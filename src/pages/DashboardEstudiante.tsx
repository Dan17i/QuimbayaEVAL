import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import {
  BookOpen, ChevronRight, AlertCircle, MessageSquare,
  Calculator, Code2, FlaskConical, Database, Globe,
  Music, Palette, Dumbbell, Landmark, Microscope,
} from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

// Colores de acento por índice
const CARD_COLORS = [
  { border: 'border-blue-400',   bg: 'bg-blue-50',    icon: 'text-blue-600',   iconBg: 'bg-blue-100'   },
  { border: 'border-emerald-400',bg: 'bg-emerald-50', icon: 'text-emerald-600',iconBg: 'bg-emerald-100'},
  { border: 'border-violet-400', bg: 'bg-violet-50',  icon: 'text-violet-600', iconBg: 'bg-violet-100' },
  { border: 'border-amber-400',  bg: 'bg-amber-50',   icon: 'text-amber-600',  iconBg: 'bg-amber-100'  },
  { border: 'border-rose-400',   bg: 'bg-rose-50',    icon: 'text-rose-600',   iconBg: 'bg-rose-100'   },
  { border: 'border-teal-400',   bg: 'bg-teal-50',    icon: 'text-teal-600',   iconBg: 'bg-teal-100'   },
];

// Icono según prefijo del código del curso
function iconoPorCodigo(codigo: string) {
  const c = codigo.toUpperCase();
  if (c.startsWith('MAT') || c.startsWith('CALC') || c.startsWith('EST')) return Calculator;
  if (c.startsWith('PROG') || c.startsWith('SIS') || c.startsWith('BD') || c.startsWith('WEB')) return Code2;
  if (c.startsWith('FIS') || c.startsWith('QUI') || c.startsWith('BIO')) return FlaskConical;
  if (c.startsWith('DB') || c.startsWith('DAT')) return Database;
  if (c.startsWith('ING') || c.startsWith('LEN') || c.startsWith('ESP')) return Globe;
  if (c.startsWith('MUS') || c.startsWith('ART')) return Music;
  if (c.startsWith('DIS') || c.startsWith('GRA')) return Palette;
  if (c.startsWith('EDF') || c.startsWith('DEP')) return Dumbbell;
  if (c.startsWith('HIS') || c.startsWith('SOC') || c.startsWith('POL')) return Landmark;
  if (c.startsWith('MED') || c.startsWith('SAL')) return Microscope;
  return BookOpen;
}

export const DashboardEstudiante: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { evaluaciones } = useEvaluaciones();
  const { cursos, loading, error, refetch } = useCursos();

  const evalAbiertasPorCurso = useMemo(() => {
    const map: Record<number, number> = {};
    evaluaciones.filter(e => e.estado === 'Activa').forEach(e => {
      map[e.cursoId] = (map[e.cursoId] ?? 0) + 1;
    });
    return map;
  }, [evaluaciones]);

  const saludo = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Estudiante';
  const totalPendientes = Object.values(evalAbiertasPorCurso).reduce((a, b) => a + b, 0);

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Inicio' }]}>
        <div className="max-w-4xl mx-auto py-2 space-y-6">

          {/* Saludo */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400">{saludo},</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
                Bienvenido, {firstName} 👋
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Tienes <span className="font-semibold text-gray-700">{cursos.length}</span> curso{cursos.length !== 1 ? 's' : ''} activos
                {totalPendientes > 0 && (
                  <> y <span className="font-semibold text-orange-600">{totalPendientes} evaluación{totalPendientes !== 1 ? 'es' : ''} pendiente{totalPendientes !== 1 ? 's' : ''}</span></>
                )}
              </p>
            </div>
          </div>

          {/* Grid de cursos */}
          {error ? (
            <EmptyState icon={AlertCircle} title="Error al cargar cursos" description={error} actionLabel="Reintentar" onAction={refetch} />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <EmptyState icon={BookOpen} title="Sin cursos inscritos" description="Aún no estás inscrito en ningún curso. Contacta a tu coordinador." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursos.map((curso, idx) => {
                const abiertas = evalAbiertasPorCurso[curso.id] ?? 0;
                const c = CARD_COLORS[idx % CARD_COLORS.length];
                const Icono = iconoPorCodigo(curso.codigo);
                return (
                  <button
                    key={curso.id}
                    onClick={() => navigate(`${ROUTES.MIS_CURSOS}/${curso.id}`)}
                    className={`
                      text-left border-t-4 ${c.border} ${c.bg}
                      rounded-2xl p-5 shadow-sm
                      hover:shadow-lg hover:-translate-y-1
                      active:scale-95
                      transition-all duration-200 group
                      flex flex-col gap-3
                    `}
                  >
                    {/* Icono + badge */}
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-xl ${c.iconBg}`}>
                        <Icono className={`w-5 h-5 ${c.icon}`} />
                      </div>
                      {abiertas > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-orange-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                          {abiertas} pendiente{abiertas > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-gray-400 leading-none mb-1 uppercase tracking-wide">{curso.codigo}</p>
                      <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{curso.nombre}</p>
                      {curso.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{curso.descripcion}</p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center gap-1 text-xs font-semibold ${c.icon} mt-auto`}>
                      Ir al curso
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* PQRS — sección administrativa claramente separada */}
          <div className="pt-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-medium">Gestión</p>
            <button
              onClick={() => navigate(ROUTES.PQRS)}
              className="w-full flex items-center justify-between gap-4 bg-white border border-dashed border-gray-300 rounded-xl px-5 py-3.5 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700">Mis PQRS</p>
                  <p className="text-xs text-gray-400">Peticiones, quejas, reclamos y sugerencias</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
