import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';

const CARD_ACCENT = [
  'border-l-blue-500', 'border-l-emerald-500', 'border-l-violet-500',
  'border-l-amber-500', 'border-l-rose-500', 'border-l-teal-500',
];

export const MisCursosPage: React.FC = () => {
  const navigate = useNavigate();
  const { cursos, loading: loadingCursos } = useCursos();
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();

  const loading = loadingCursos || loadingEvals;

  const evalAbiertasPorCurso = useMemo(() => {
    const map: Record<number, number> = {};
    evaluaciones.filter(e => e.estado === 'Activa').forEach(e => {
      map[e.cursoId] = (map[e.cursoId] ?? 0) + 1;
    });
    return map;
  }, [evaluaciones]);

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Inicio', href: ROUTES.DASHBOARD }, { label: 'Mis Cursos' }]}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mis Cursos</h2>
            <p className="text-gray-500 text-sm mt-1">Cursos en los que estás inscrito</p>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando cursos..." />
          ) : cursos.length === 0 ? (
            <EmptyState icon={BookOpen} title="No tienes cursos" description="No estás inscrito en ningún curso en este momento." />
          ) : (
            <div className="space-y-3">
              {cursos.map((curso, idx) => {
                const abiertas = evalAbiertasPorCurso[curso.id] ?? 0;
                return (
                  <button
                    key={curso.id}
                    onClick={() => navigate(`${ROUTES.MIS_CURSOS}/${curso.id}`)}
                    className={`
                      w-full text-left border-l-4 ${CARD_ACCENT[idx % CARD_ACCENT.length]}
                      bg-white rounded-xl px-5 py-4 shadow-sm
                      hover:shadow-md hover:-translate-y-0.5
                      transition-all duration-150 group
                      flex items-center justify-between gap-4
                    `}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-gray-50 p-2.5 rounded-lg flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono text-gray-400 leading-none mb-1">{curso.codigo}</p>
                        <p className="font-semibold text-gray-900 leading-snug truncate">{curso.nombre}</p>
                        {curso.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{curso.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {abiertas > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                          {abiertas} pendiente{abiertas > 1 ? 's' : ''}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
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
