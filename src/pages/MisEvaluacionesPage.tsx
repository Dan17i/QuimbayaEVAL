import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Clock, CheckCircle, Calendar, Play, Eye, ArrowLeft, Search, AlertCircle, FileText } from 'lucide-react';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';
import { Evaluacion } from '../types';

export const MisEvaluacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Activas: desde el endpoint filtrado por matrícula
  const { evaluaciones: evaluacionesActivasRaw } = useEvaluaciones(undefined, true);
  // Programadas y cerradas: desde getAll
  const { evaluaciones, getByEstado } = useEvaluaciones();
  const { cursos } = useCursos();

  // cursoFiltro guarda el cursoId como string, o 'Todos'
  const [cursoFiltro, setCursoFiltro] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [evaluacionDetalle, setEvaluacionDetalle] = useState<Evaluacion | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState<boolean>(false);

  // Pre-filtrar si viene ?cursoId= en la URL
  useEffect(() => {
    const cursoId = searchParams.get('cursoId');
    if (cursoId) setCursoFiltro(cursoId);
  }, [searchParams]);

  const abrirDetalles = (ev: Evaluacion) => {
    setEvaluacionDetalle(ev);
    setModalDetalleOpen(true);
  };

  const coincideBusqueda = (e: Evaluacion) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      e.name.toLowerCase().includes(q) ||
      e.curso.toLowerCase().includes(q) ||
      (e.tipo && e.tipo.toLowerCase().includes(q))
    );
  };

  const evaluacionesAbiertas = useMemo(() =>
    evaluacionesActivasRaw
      .filter(e => cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro)
      .filter(coincideBusqueda),
    [evaluacionesActivasRaw, cursoFiltro, busqueda]
  );

  const evaluacionesProximas = useMemo(() =>
    getByEstado('Programada')
      .filter(e => cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro)
      .filter(coincideBusqueda),
    [getByEstado, cursoFiltro, busqueda]
  );

  const evaluacionesCerradas = useMemo(() =>
    getByEstado('Cerrada')
      .filter(e => cursoFiltro === 'Todos' || String(e.cursoId) === cursoFiltro)
      .filter(coincideBusqueda),
    [getByEstado, cursoFiltro, busqueda]
  );

  // Cursos que tienen al menos una evaluación (activas + el resto)
  const cursosConEvals = useMemo(() => {
    const ids = new Set([...evaluaciones, ...evaluacionesActivasRaw].map(e => e.cursoId));
    return cursos.filter(c => ids.has(c.id));
  }, [evaluaciones, evaluacionesActivasRaw, cursos]);

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

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre de evaluación, curso o tipo..."
                className="pl-9 bg-white"
              />
            </div>
            {busqueda && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBusqueda('')}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Limpiar búsqueda
              </Button>
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
                  description={
                    busqueda
                      ? 'No hay evaluaciones abiertas que coincidan con tu búsqueda.'
                      : `No tienes evaluaciones abiertas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`
                  }
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesAbiertas.map((evaluacion) => (
                    <Card key={evaluacion.id} className="border-orange-200 bg-orange-50/30">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="warning">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900 font-medium">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Docente:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Fecha límite:</span>
                                <span className="ml-2 text-orange-600 font-medium">{formatDateTime(evaluacion.deadline)}</span>
                              </div>
                              {evaluacion.duracion && (
                                <div>
                                  <span className="text-gray-600">Duración:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.duracion}</span>
                                </div>
                              )}
                              {evaluacion.intentos && (
                                <div>
                                  <span className="text-gray-600">Intentos permitidos:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.intentos}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5"
                              onClick={() => abrirDetalles(evaluacion)}
                            >
                              <Eye className="w-4 h-4" />
                              Detalles
                            </Button>
                            <Button 
                              size="sm"
                              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white" 
                              onClick={() => navigate(`${ROUTES.REALIZAR_EVALUACION}?id=${evaluacion.id}`)}
                            >
                              <Play className="w-4 h-4" />
                              Iniciar Evaluación
                            </Button>
                          </div>
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
                  description={
                    busqueda
                      ? 'No hay evaluaciones programadas que coincidan con tu búsqueda.'
                      : `No tienes evaluaciones programadas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`
                  }
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesProximas.map((evaluacion) => (
                    <Card key={evaluacion.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="info">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900 font-medium">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Docente:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Apertura programada:</span>
                                <span className="ml-2 text-purple-600 font-medium">{formatDateTime(evaluacion.deadline)}</span>
                              </div>
                              {evaluacion.duracion && (
                                <div>
                                  <span className="text-gray-600">Duración:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.duracion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => abrirDetalles(evaluacion)}
                          >
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
                  description={
                    busqueda
                      ? 'No hay evaluaciones cerradas que coincidan con tu búsqueda.'
                      : `No tienes evaluaciones cerradas${cursoActivo ? ` para ${cursoActivo.nombre}` : ''}`
                  }
                />
              ) : (
                <div className="space-y-4">
                  {evaluacionesCerradas.map((evaluacion) => (
                    <Card key={evaluacion.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-gray-900">{evaluacion.name}</h3>
                              <Badge variant="success">{evaluacion.tipo}</Badge>
                              <StatusBadge estado={evaluacion.estado} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Curso:</span>
                                <span className="ml-2 text-gray-900 font-medium">{evaluacion.curso}</span>
                              </div>
                              {evaluacion.profesor && (
                                <div>
                                  <span className="text-gray-600">Docente:</span>
                                  <span className="ml-2 text-gray-900">{evaluacion.profesor}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Fecha de cierre:</span>
                                <span className="ml-2 text-gray-900">{formatDate(evaluacion.deadline)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600"
                              onClick={() => abrirDetalles(evaluacion)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ficha
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" 
                              onClick={() => navigate(`${ROUTES.HISTORIAL}?evaluacionId=${evaluacion.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                              Ver Feedback
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Modal accesible de detalles de la evaluación */}
          <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
            <DialogContent className="max-w-lg">
              {evaluacionDetalle && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">{evaluacionDetalle.tipo}</Badge>
                      <StatusBadge estado={evaluacionDetalle.estado} />
                    </div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      {evaluacionDetalle.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      {evaluacionDetalle.curso}
                      {evaluacionDetalle.profesor && ` • Docente: ${evaluacionDetalle.profesor}`}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2 text-sm">
                    {evaluacionDetalle.descripcion && (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-700 leading-relaxed border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Descripción / Instrucciones
                        </p>
                        {evaluacionDetalle.descripcion}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 bg-blue-50/60 p-3.5 rounded-lg border border-blue-100 text-xs">
                      <div>
                        <span className="font-semibold text-blue-900 block mb-0.5">
                          {evaluacionDetalle.estado === 'Programada' ? 'Fecha de Apertura:' : 'Fecha de Cierre:'}
                        </span>
                        <span className="text-blue-800 font-medium">
                          {formatDateTime(evaluacionDetalle.deadline)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-900 block mb-0.5">Tiempo Límite:</span>
                        <span className="text-blue-800 font-medium">
                          {evaluacionDetalle.duracion || 'Sin límite'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-900 block mb-0.5">Intentos Permitidos:</span>
                        <span className="text-blue-800 font-medium">
                          {evaluacionDetalle.intentos ? `${evaluacionDetalle.intentos} intento(s)` : '1 intento'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-900 block mb-0.5">Modalidad:</span>
                        <span className="text-blue-800 font-medium">Evaluación en línea</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        Recomendaciones para el estudiante:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                        <li>Verifica que dispones de una conexión estable antes de comenzar.</li>
                        <li>Las respuestas se autoguardan progresivamente en tu dispositivo.</li>
                        <li>Al agotarse el cronómetro, la prueba se enviará de forma automática.</li>
                      </ul>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setModalDetalleOpen(false)}>
                      Cerrar
                    </Button>
                    {evaluacionDetalle.estado === 'Activa' && (
                      <Button
                        className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => {
                          setModalDetalleOpen(false);
                          navigate(`${ROUTES.REALIZAR_EVALUACION}?id=${evaluacionDetalle.id}`);
                        }}
                      >
                        <Play className="w-4 h-4" /> Iniciar Evaluación Ahora
                      </Button>
                    )}
                    {evaluacionDetalle.estado === 'Cerrada' && (
                      <Button
                        variant="outline"
                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setModalDetalleOpen(false);
                          navigate(`${ROUTES.HISTORIAL}?evaluacionId=${evaluacionDetalle.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" /> Ver Retroalimentación
                      </Button>
                    )}
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
