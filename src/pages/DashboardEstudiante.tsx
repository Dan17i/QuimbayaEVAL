import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, ChevronRight, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

// Colores por índice para dar variedad visual a las tarjetas
const CARD_COLORS = [
  { border: 'border-blue-400',   bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   badge: 'bg-orange-100 text-orange-700', btn: 'text-blue-700 border-blue-200 hover:bg-blue-100' },
  { border: 'border-green-400',  bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  badge: 'bg-orange-100 text-orange-700', btn: 'text-green-700 border-green-200 hover:bg-green-100' },
  { border: 'border-purple-400', bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', badge: 'bg-orange-100 text-orange-700', btn: 'text-purple-700 border-purple-200 hover:bg-purple-100' },
  { border: 'border-teal-400',   bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',   badge: 'bg-orange-100 text-orange-700', btn: 'text-teal-700 border-teal-200 hover:bg-teal-100' },
];

export const DashboardEstudiante: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const estudianteId = user ? Number(user.id) : undefined;

  const { evaluaciones, loading: loadingEvals, error: errorEvals, refetch: refetchEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos, error: errorCursos, refetch: refetchCursos } = useCursos();
  const { submissions, loading: loadingSubs } = useSubmissions(estudianteId);

  const loading = loadingEvals || loadingCursos || loadingSubs;

  // Evaluaciones abiertas agrupadas por cursoId
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

  // Saludo según hora del día
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
        <div className="space-y-8">

          {/* Bienvenida */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-md">
            <p className="text-blue-100 text-sm mb-1">{saludo},</p>
            <h2 className="text-2xl font-bold">{firstName} 👋</h2>
            <p className="text-blue-100 mt-2 text-sm">
              Tienes <span className="font-semibold text-white">{cursos.length}</span> curso{cursos.length !== 1 ? 's' : ''} inscritos
              {' '}y <span className="font-semibold text-white">{Object.values(evalAbiertasPorCurso).reduce((a, b) => a + b, 0)}</span> evaluación{Object.values(evalAbiertasPorCurso).reduce((a, b) => a + b, 0) !== 1 ? 'es' : ''} abierta{Object.values(evalAbiertasPorCurso).reduce((a, b) => a + b, 0) !== 1 ? 's' : ''} pendiente{Object.values(evalAbiertasPorCurso).reduce((a, b) => a + b, 0) !== 1 ? 's' : ''}.
            </p>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
                <p className="font-bold text-lg leading-none">{completadas}</p>
                <p className="text-blue-100 text-xs mt-0.5">Completadas</p>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
                <p className="font-bold text-lg leading-none">{evaluaciones.length}</p>
                <p className="text-blue-100 text-xs mt-0.5">Total evals.</p>
              </div>
            </div>
          </div>

          {/* Mis Cursos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mis Cursos</h3>
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1" onClick={() => navigate(ROUTES.MIS_CURSOS)}>
                Ver todos <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <EmptyState icon={BookOpen} title="Sin cursos inscritos" description="Aún no estás inscrito en ningún curso." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cursos.map((curso, idx) => {
                  const color = CARD_COLORS[idx % CARD_COLORS.length];
                  const evalsAbiertas = evalAbiertasPorCurso[curso.id] ?? 0;
                  return (
                    <article
                      key={curso.id}
                      className={`border-l-4 ${color.border} ${color.bg} rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer`}
                      onClick={() => navigate(`${ROUTES.MIS_EVALUACIONES}?cursoId=${curso.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2 rounded-lg ${color.icon}`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {evalsAbiertas > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge}`}>
                            {evalsAbiertas} abierta{evalsAbiertas > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-mono text-gray-400 mb-1">{curso.codigo}</p>
                        <h4 className="font-semibold text-gray-900 leading-tight">{curso.nombre}</h4>
                        {curso.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{curso.descripcion}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${color.btn.split(' ')[0]}`}>
                        Ver evaluaciones <ChevronRight className="w-3 h-3" />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Accesos rápidos */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer" onClick={() => navigate(`${ROUTES.MIS_EVALUACIONES}?tab=abiertas`)}>
                <CardHeader>
                  <div className="bg-orange-50 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-base">Evaluaciones Abiertas</CardTitle>
                  <CardDescription>Pendientes de presentar</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg hover:border-green-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.HISTORIAL)}>
                <CardHeader>
                  <div className="bg-green-50 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-base">Historial</CardTitle>
                  <CardDescription>Calificaciones y feedback</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate(ROUTES.MIS_EVALUACIONES)}>
                <CardHeader>
                  <div className="bg-blue-50 w-11 h-11 rounded-lg flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">Mis Evaluaciones</CardTitle>
                  <CardDescription>Todas las evaluaciones</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
