import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  BookOpen, ChevronRight, AlertCircle,
  CheckCircle, Clock, FileText, GraduationCap,
} from 'lucide-react';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

const CARD_COLORS = [
  { border: 'border-l-blue-500',   bg: 'bg-blue-50',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   label: 'text-blue-700' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', label: 'text-emerald-700' },
  { border: 'border-l-violet-500', bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600', label: 'text-violet-700' },
  { border: 'border-l-amber-500',  bg: 'bg-amber-50',  iconBg: 'bg-amber-100',  iconText: 'text-amber-600',  label: 'text-amber-700' },
];

export const DashboardEstudiante: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const estudianteId = user ? Number(user.id) : undefined;

  const { evaluaciones, loading: loadingEvals, error: errorEvals, refetch: refetchEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos, error: errorCursos, refetch: refetchCursos } = useCursos();
  const { submissions, loading: loadingSubs } = useSubmissions(estudianteId);

  const loading = loadingEvals || loadingCursos || loadingSubs;

  const totalAbiertas = useMemo(() =>
    evaluaciones.filter(e => e.estado === 'Activa').length,
    [evaluaciones]
  );

  const evalAbiertasPorCurso = useMemo(() => {
    const map: Record<number, number> = {};
    evaluaciones.filter(e => e.estado === 'Activa').forEach(e => {
      map[e.cursoId] = (map[e.cursoId] ?? 0) + 1;
    });
    return map;
  }, [evaluaciones]);

  const completadas = useMemo(() =>
    submissions.filter(s => s.estado === 'Calificada' || s.estado === 'Enviada').length,
    [submissions]
  );

  const saludo = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Estudiante';

  if (errorEvals || errorCursos) {
    return (
      <ProtectedRoute allowedRoles={['estudiante']}>
        <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
          <EmptyState
            icon={AlertCircle}
            title="Error al cargar datos"
            description={errorEvals || errorCursos || 'No se pudieron cargar los datos.'}
            actionLabel="Reintentar"
            onAction={() => { refetchEvals(); refetchCursos(); }}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-6">

          {/* ── Banner de bienvenida ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-8 right-16 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Avatar + saludo */}
              <div className="flex items-center gap-4">
                {user?.fotoUrl ? (
                  <img
                    src={user.fotoUrl}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 select-none">
                    {user?.name?.trim().split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-blue-200 text-sm">{saludo},</p>
                  <h2 className="text-2xl font-bold leading-tight">{firstName} 👋</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Aquí está tu resumen académico</p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[68px]">
                  {loading ? (
                    <div className="h-6 w-8 bg-white/30 rounded animate-pulse mx-auto mb-1" />
                  ) : (
                    <p className="text-2xl font-bold leading-none">{cursos.length}</p>
                  )}
                  <p className="text-blue-100 text-xs mt-1">Cursos</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[68px]">
                  {loading ? (
                    <div className="h-6 w-8 bg-white/30 rounded animate-pulse mx-auto mb-1" />
                  ) : (
                    <p className="text-2xl font-bold leading-none">{totalAbiertas}</p>
                  )}
                  <p className="text-blue-100 text-xs mt-1">Abiertas</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[68px]">
                  {loading ? (
                    <div className="h-6 w-8 bg-white/30 rounded animate-pulse mx-auto mb-1" />
                  ) : (
                    <p className="text-2xl font-bold leading-none">{completadas}</p>
                  )}
                  <p className="text-blue-100 text-xs mt-1">Hechas</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mis Cursos ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Mis Cursos</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 gap-1 text-sm"
                onClick={() => navigate(ROUTES.MIS_CURSOS)}
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Sin cursos inscritos"
                description="Aún no estás inscrito en ningún curso."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cursos.map((curso, idx) => {
                  const c = CARD_COLORS[idx % CARD_COLORS.length];
                  const evalsAbiertas = evalAbiertasPorCurso[curso.id] ?? 0;
                  return (
                    <article
                      key={curso.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ir a evaluaciones de ${curso.nombre}`}
                      className={`
                        border-l-4 ${c.border} ${c.bg}
                        rounded-xl p-4 shadow-sm
                        hover:shadow-md hover:-translate-y-0.5
                        transition-all duration-150 cursor-pointer
                        flex flex-col gap-2
                      `}
                      onClick={() => navigate(`${ROUTES.MIS_EVALUACIONES}?cursoId=${curso.id}`)}
                      onKeyDown={e => e.key === 'Enter' && navigate(`${ROUTES.MIS_EVALUACIONES}?cursoId=${curso.id}`)}
                    >
                      {/* Icono + badge */}
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-lg ${c.iconBg}`}>
                          <BookOpen className={`w-4 h-4 ${c.iconText}`} />
                        </div>
                        {evalsAbiertas > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            {evalsAbiertas} abierta{evalsAbiertas > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-gray-400 leading-none mb-1">{curso.codigo}</p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{curso.nombre}</p>
                        {curso.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-snug">{curso.descripcion}</p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className={`flex items-center gap-1 text-xs font-medium ${c.label} mt-1`}>
                        Ver evaluaciones <ChevronRight className="w-3 h-3" />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Accesos Rápidos ── */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Accesos Rápidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card
                className="hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}
              >
                <CardHeader className="pb-4">
                  <div className="bg-orange-50 group-hover:bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm">Evaluaciones Abiertas</CardTitle>
                  <CardDescription className="text-xs">Pendientes de presentar</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
                onClick={() => navigate(ROUTES.HISTORIAL)}
              >
                <CardHeader className="pb-4">
                  <div className="bg-green-50 group-hover:bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm">Historial</CardTitle>
                  <CardDescription className="text-xs">Calificaciones y feedback</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}
              >
                <CardHeader className="pb-4">
                  <div className="bg-blue-50 group-hover:bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm">Mis Evaluaciones</CardTitle>
                  <CardDescription className="text-xs">Todas las evaluaciones</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
