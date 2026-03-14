import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Clock, CheckCircle, Calendar, Play, Eye, ArrowLeft } from 'lucide-react';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

export const MisEvaluacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { evaluaciones, getByEstado } = useEvaluaciones();
  const { cursos } = useCursos();

  // cursoFiltro guarda el cursoId como string, o 'Todos'
  const [cursoFiltro, setCursoFiltro] = useState<string>('Todos');

  // Pre-filtrar si viene ?cursoId= en la URL
  useEffect(() => {
    const cursoId = searchParams.get('cursoId');
    if (cursoId) setCursoFiltro(cursoId);
  }, [searchParams]);

  const evaluacionesAbiertas = useMemo(() => 
    getByEstado('Activa').filter(e => 
      cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  const evaluacionesProximas = useMemo(() => 
    getByEstado('Programada').filter(e => 
      cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  const evaluacionesCerradas = useMemo(() => 
    getByEstado('Cerrada').filter(e => 
      cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  // Cursos que tienen al menos una evaluación
  const cursosConEvals = useMemo(() => {
    const ids = new Set(evaluaciones.map(e => e.cursoId));
    return cursos.filter(c => ids.has(c.id));
  }, [evaluaciones, cursos]);

  const cursoActivo = cursoFiltro !== 'Todos'
    ? cursos.find(c => String(c.id) === cursoFiltro)
    : null;

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        {cursoActivo && (
          <button
            onClick={() => { setCursoFiltro('Todos'); navigate(ROUTES.MIS_EVALUACIONES); }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Todos los cursos
          </button>
        )}
        <h3 className="mb-4">Filtrar por Curso</h3>
        <div className="space-y-2">
          <button
            onClick={() => setCursoFiltro('Todos')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
              cursoFiltro === 'Todos'
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          {cursosConEvals.map((curso) => (
            <button
              key={curso.id}
              onClick={() => setCursoFiltro(String(curso.id))}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                cursoFiltro === String(curso.id)
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="font-mono text-xs text-gray-400 mr-1">{curso.codigo}</span>
              {curso.nombre}
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">Estados</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Abierta:</strong> Disponible para rendir</li>
            <li><strong>Próxima:</strong> Programada para el futuro</li>
            <li><strong>Cerrada:</strong> Finalizada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Mis Evaluaciones', href: ROUTES.MIS_EVALUACIONES },
          ...(cursoActivo ? [{ label: cursoActivo.nombre }] : []),
        ]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div>
            {cursoActivo ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">{cursoActivo.codigo}</span>
                </div>
                <h2>{cursoActivo.nombre}</h2>
                <p className="text-gray-600 mt-1">Evaluaciones de este curso</p>
              </>
            ) : (
              <>
                <h2>Mis Evaluaciones</h2>
                <p className="text-gray-600 mt-2">Gestiona tus evaluaciones por estado y curso</p>
              </>
            )}
          </div>

          <Tabs defaultValue="abiertas">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abiertas" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Abiertas ({evaluacionesAbiertas.length})
              </TabsTrigger>
              <TabsTrigger value="proximas" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Próximas ({evaluacionesProximas.length})
              </TabsTrigger>
              <TabsTrigger value="cerradas" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Cerradas ({evaluacionesCerradas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abiertas" className="mt-6">
              {evaluacionesAbiertas.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No hay evaluaciones abiertas"
                  description={`No tienes evaluaciones abiertas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`}
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesAbiertas.map((evaluacion) => (
                    <Card key={evaluacion.id} className="border-orange-200 bg-orange-50/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="warning">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Profesor:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Fecha límite:</span>
                                <span className="ml-2 text-orange-600">{formatDateTime(evaluacion.deadline)}</span>
                              </div>
                              {evaluacion.duracion && (
                                <div>
                                  <span className="text-gray-600">Duración:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.duracion}</span>
                                </div>
                              )}
                              {evaluacion.intentos && (
                                <div>
                                  <span className="text-gray-600">Intentos:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.intentos}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            className="ml-4 flex items-center gap-2" 
                            onClick={() => navigate(`${ROUTES.REALIZAR_EVALUACION}?id=${evaluacion.id}`)}
                          >
                            <Play className="w-4 h-4" />
                            Iniciar Evaluación
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="proximas" className="mt-6">
              {evaluacionesProximas.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No hay evaluaciones próximas"
                  description={`No tienes evaluaciones programadas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`}
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesProximas.map((evaluacion) => (
                    <Card key={evaluacion.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="info">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Profesor:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Abre el:</span>
                                <span className="ml-2 text-purple-600">{formatDateTime(evaluacion.deadline)}</span>
                              </div>
                              {evaluacion.duracion && (
                                <div>
                                  <span className="text-gray-600">Duración:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.duracion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" className="ml-4 flex items-center gap-2" onClick={() => navigate(`${ROUTES.MIS_EVALUACIONES}/${evaluacion.id}`)}>
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cerradas" className="mt-6">
              {evaluacionesCerradas.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="No hay evaluaciones cerradas"
                  description={`No tienes evaluaciones cerradas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`}
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesCerradas.map((evaluacion) => (
                    <Card key={evaluacion.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="success">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Profesor:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Fecha de cierre:</span>
                                <span className="ml-2 text-gray-900">{formatDate(evaluacion.deadline)}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="ml-4 flex items-center gap-2" 
                            onClick={() => navigate(ROUTES.HISTORIAL)}
                          >
                            <Eye className="w-4 h-4" />
                            Ver Feedback
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
