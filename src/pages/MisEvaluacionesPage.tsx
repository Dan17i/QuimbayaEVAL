import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Clock, CheckCircle, Calendar, Play, Eye } from 'lucide-react';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';

export const MisEvaluacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluaciones, getByEstado } = useEvaluaciones();
  const { cursos } = useCursos();
  const [cursoFiltro, setCursoFiltro] = useState<string>('Todos');

  const evaluacionesAbiertas = useMemo(() => 
    getByEstado('Activa').filter(e => 
      cursoFiltro === 'Todos' || e.curso === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  const evaluacionesProximas = useMemo(() => 
    getByEstado('Programada').filter(e => 
      cursoFiltro === 'Todos' || e.curso === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  const evaluacionesCerradas = useMemo(() => 
    getByEstado('Cerrada').filter(e => 
      cursoFiltro === 'Todos' || e.curso === cursoFiltro
    ), 
    [getByEstado, cursoFiltro]
  );

  const cursosUnicos = useMemo(() => {
    const cursosSet = new Set(evaluaciones.map(e => e.curso));
    return Array.from(cursosSet).sort();
  }, [evaluaciones]);

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
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
          {cursosUnicos.map((curso) => (
            <button
              key={curso}
              onClick={() => setCursoFiltro(curso)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                cursoFiltro === curso 
                  ? 'bg-blue-100 text-blue-900 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {curso}
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">Estados</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Abierta:</strong> Disponible para rendir</li>
            <li><strong>Próxima:</strong> Programada para el futuro</li>
            <li><strong>Cerrada:</strong> Finalizada</li>
            <li><strong>Calificado:</strong> Con nota publicada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Mis Evaluaciones' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div>
            <h2>Mis Evaluaciones</h2>
            <p className="text-gray-600 mt-2">Gestiona tus evaluaciones por estado y curso</p>
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
                  description={`No tienes evaluaciones abiertas${cursoFiltro !== 'Todos' ? ` para el curso ${cursoFiltro}` : ''}`}
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
                            onClick={() => navigate(ROUTES.REALIZAR_EVALUACION)}
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
                  description={`No tienes evaluaciones programadas${cursoFiltro !== 'Todos' ? ` para el curso ${cursoFiltro}` : ''}`}
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
                          <Button variant="outline" className="ml-4 flex items-center gap-2">
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
                  description={`No tienes evaluaciones cerradas${cursoFiltro !== 'Todos' ? ` para el curso ${cursoFiltro}` : ''}`}
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
