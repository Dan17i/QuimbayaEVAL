import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { BookOpen, ChevronRight, Search, Clock, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
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
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones(undefined, true);

  const [busqueda, setBusqueda] = useState('');
  const [soloConPendientes, setSoloConPendientes] = useState(false);

  const loading = loadingCursos || loadingEvals;

  const evalAbiertasPorCurso = useMemo(() => {
    const map: Record<number, number> = {};
    evaluaciones.forEach(e => {
      map[e.cursoId] = (map[e.cursoId] ?? 0) + 1;
    });
    return map;
  }, [evaluaciones]);

  const cursosFiltrados = useMemo(() => {
    return cursos.filter(c => {
      const abiertas = evalAbiertasPorCurso[c.id] ?? 0;
      if (soloConPendientes && abiertas === 0) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(q))
      );
    });
  }, [cursos, evalAbiertasPorCurso, soloConPendientes, busqueda]);

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Inicio', href: ROUTES.DASHBOARD }, { label: 'Mis Cursos' }]}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mis Cursos</h2>
            <p className="text-gray-500 text-sm mt-1">Cursos en los que te encuentras matriculado actualmente</p>
          </div>

          {/* Filtros de búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código de curso..."
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSoloConPendientes(false)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                  !soloConPendientes
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos ({cursos.length})
              </button>
              <button
                onClick={() => setSoloConPendientes(true)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  soloConPendientes
                    ? 'bg-white text-orange-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                Con pendientes
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando cursos..." />
          ) : cursosFiltrados.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={busqueda || soloConPendientes ? 'Sin resultados' : 'No tienes cursos'}
              description={
                busqueda || soloConPendientes
                  ? 'No se encontraron cursos que coincidan con los filtros aplicados.'
                  : 'No estás inscrito en ningún curso en este momento.'
              }
            />
          ) : (
            <div className="space-y-3">
              {cursosFiltrados.map((curso, idx) => {
                const abiertas = evalAbiertasPorCurso[curso.id] ?? 0;
                return (
                  <div
                    key={curso.id}
                    className={`
                      border-l-4 ${CARD_ACCENT[idx % CARD_ACCENT.length]}
                      bg-white rounded-xl p-4 shadow-sm
                      hover:shadow-md transition-all
                      flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4
                    `}
                  >
                    <div 
                      className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                      onClick={() => navigate(`${ROUTES.MIS_CURSOS}/${curso.id}`)}
                    >
                      <div className="bg-gray-50 p-2.5 rounded-lg flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono text-gray-400 leading-none mb-1">{curso.codigo}</p>
                        <p className="font-semibold text-gray-900 leading-snug truncate hover:text-blue-600 transition-colors">
                          {curso.nombre}
                        </p>
                        {curso.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{curso.descripcion}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      {abiertas > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 font-medium px-2.5 h-8 gap-1.5"
                          onClick={() => navigate(`${ROUTES.MIS_EVALUACIONES}?cursoId=${curso.id}`)}
                        >
                          <Clock className="w-3.5 h-3.5 text-orange-600" />
                          {abiertas} pendiente{abiertas > 1 ? 's' : ''}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1"
                        onClick={() => navigate(`${ROUTES.MIS_CURSOS}/${curso.id}`)}
                      >
                        Entrar al curso
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
