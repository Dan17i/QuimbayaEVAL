import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { BookOpen, ChevronRight, AlertCircle, MessageSquare } from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

const CARD_ACCENT = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-teal-500',
];

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

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Inicio' }]}>
        <div className="max-w-3xl mx-auto space-y-8 py-2">

          {/* Saludo */}
          <div>
            <p className="text-sm text-gray-500">{saludo},</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              Bienvenido, {firstName} 👋
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Selecciona un curso para ver tus actividades y evaluaciones pendientes.
            </p>
          </div>

          {/* Cursos */}
          {error ? (
            <EmptyState
              icon={AlertCircle}
              title="Error al cargar cursos"
              description={error}
              actionLabel="Reintentar"
              onAction={refetch}
            />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin cursos inscritos"
              description="Aún no estás inscrito en ningún curso. Contacta a tu coordinador."
            />
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

          {/* Acceso rápido a PQRS — siempre visible */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => navigate(ROUTES.PQRS)}
              className="w-full flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Mis PQRS</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ver estado de tus solicitudes y respuestas</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 flex-shrink-0" />
            </button>
          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
