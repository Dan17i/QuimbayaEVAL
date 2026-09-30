import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Award, FileText, TrendingUp, Search, Eye,
  CheckCircle2, XCircle, MessageSquareQuote, AlertCircle,
  Clock, BookOpen,
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { calificacionesService, Calificacion } from '../services/calificacionesService';
import { preguntasService, Pregunta } from '../services/preguntasService';
import { submissionsService, Submission } from '../services/submissionsService';
import { formatDate, formatDateTime } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { toast } from 'sonner';

export const HistorialPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroAprobacion, setFiltroAprobacion] = useState<'Todos' | 'Aprobado' | 'Reprobado'>('Todos');

  // Modal de feedback detallado
  const [selectedResultado, setSelectedResultado] = useState<ResultadoDetalle | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await resultadosService.getMisResultados() as unknown as ResultadoDetalle[];
        setResultados(data);
      } catch {
        toast.error('Error', { description: 'No se pudo cargar el historial' });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Función para abrir modal y consultar desglose
  const abrirDetalleFeedback = async (r: ResultadoDetalle) => {
    setSelectedResultado(r);
    setFeedbackModalOpen(true);
    setLoadingDetalle(true);
    try {
      const promises: [Promise<Calificacion[]>, Promise<Pregunta[]>, Promise<Submission | null>] = [
        calificacionesService.getBySubmission(r.submissionId).catch(() => []),
        r.evaluacionId ? preguntasService.getByEvaluacion(r.evaluacionId).catch(() => []) : Promise.resolve([]),
        submissionsService.getById(r.submissionId).catch(() => null),
      ];
      const [califs, pregs, sub] = await Promise.all(promises);
      setCalificaciones(califs);
      setPreguntas(pregs);
      setSubmission(sub);
    } catch {
      toast.error('No se pudo cargar la retroalimentación detallada');
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Abrir automáticamente si viene ?evaluacionId en la URL
  useEffect(() => {
    const evalIdParam = searchParams.get('evaluacionId');
    if (evalIdParam && resultados.length > 0) {
      const match = resultados.find(r => String(r.evaluacionId) === evalIdParam);
      if (match) {
        abrirDetalleFeedback(match);
      }
    }
  }, [searchParams, resultados]);

  // Parsear respuestas del estudiante
  const respuestasParseadas = useMemo<Record<string, string>>(() => {
    if (!submission?.respuestasJson) return {};
    try {
      return JSON.parse(submission.respuestasJson) as Record<string, string>;
    } catch {
      return {};
    }
  }, [submission]);

  // Mapa de calificaciones por ID de pregunta
  const califMap = useMemo(() => {
    const map = new Map<number, Calificacion>();
    calificaciones.forEach(c => map.set(c.preguntaId, c));
    return map;
  }, [calificaciones]);

  // Filtrado reactivo de resultados
  const resultadosFiltrados = useMemo(() => {
    return resultados.filter(r => {
      const cumpleFiltro = filtroAprobacion === 'Todos' || r.estadoAprobacion === filtroAprobacion;
      if (!cumpleFiltro) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        (r.evaluacionNombre && r.evaluacionNombre.toLowerCase().includes(q)) ||
        (r.cursoNombre && r.cursoNombre.toLowerCase().includes(q)) ||
        (r.profesorNombre && r.profesorNombre.toLowerCase().includes(q))
      );
    });
  }, [resultados, filtroAprobacion, busqueda]);

  const estadisticas = useMemo<Estadistica[]>(() => {
    if (resultados.length === 0) return [
      { label: 'Promedio General', value: '—', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Evaluaciones Completadas', value: '0', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Tasa de Aprobación', value: '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
    const promedio = resultados.reduce((acc, r) => acc + (r.notaEscala ?? r.porcentaje / 20), 0) / resultados.length;
    const aprobados = resultados.filter(r => (r.notaEscala ?? 0) >= 3).length;
    return [
      { label: 'Promedio General', value: promedio.toFixed(1), icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Evaluaciones Completadas', value: String(resultados.length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Tasa de Aprobación', value: `${Math.round((aprobados / resultados.length) * 100)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  }, [resultados]);

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Estadísticas</h3>
        <div className="space-y-4">
          {estadisticas.map((stat) => (
            <div key={stat.label} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">Criterio de Aprobación</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Se considera aprobada toda evaluación con nota igual o superior a <strong>3.0 / 5.0</strong> (60%).
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Historial' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div>
            <h2>Historial de Calificaciones</h2>
            <p className="text-gray-600 mt-2">Revisa tus calificaciones y retroalimentación académica detallada</p>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por evaluación, curso o docente..."
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
              {(['Todos', 'Aprobado', 'Reprobado'] as const).map(estado => (
                <button
                  key={estado}
                  onClick={() => setFiltroAprobacion(estado)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                    filtroAprobacion === estado
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando historial..." />
          ) : resultadosFiltrados.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={busqueda || filtroAprobacion !== 'Todos' ? 'Sin coincidencias' : 'No hay historial'}
              description={
                busqueda || filtroAprobacion !== 'Todos'
                  ? 'No se encontraron resultados con los criterios seleccionados.'
                  : 'Aún no has completado ninguna evaluación.'
              }
            />
          ) : (
            <div className="space-y-4">
              {resultadosFiltrados.map((r) => {
                const nota = r.notaEscala ?? (r.porcentaje / 20);
                const aprobado = r.estadoAprobacion === 'Aprobado';
                return (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">
                            {r.evaluacionNombre ?? `Evaluación #${r.submissionId}`}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {r.cursoNombre ?? '—'} • Entregada el {formatDate(r.createdAt)}
                          </p>
                          {r.profesorNombre && (
                            <p className="text-xs text-gray-500 mt-0.5">Docente: {r.profesorNombre}</p>
                          )}
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                          <div className="text-right">
                            <span className={`text-3xl font-bold ${aprobado ? 'text-green-600' : 'text-red-500'}`}>
                              {nota.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              aprobado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.estadoAprobacion}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Puntaje obtenido: <strong>{r.puntuacionTotal}</strong> / {r.puntuacionMaxima} pts</span>
                          <span className="font-medium">{r.porcentaje?.toFixed(1)}%</span>
                        </div>
                        <Progress value={r.porcentaje ?? 0} className="h-2" />
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => abrirDetalleFeedback(r)}
                          >
                            <Eye className="w-4 h-4" />
                            Ver Retroalimentación Detallada
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Accesible de Retroalimentación Detallada */}
        <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-blue-600" />
                Retroalimentación de la Evaluación
              </DialogTitle>
              <DialogDescription>
                {selectedResultado?.evaluacionNombre} • {selectedResultado?.cursoNombre}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
              {/* Tarjeta de Resumen */}
              {selectedResultado && (
                <div className="bg-gray-50 border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Nota Obtenida</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-4xl font-extrabold ${selectedResultado.estadoAprobacion === 'Aprobado' ? 'text-green-600' : 'text-red-500'}`}>
                        {(selectedResultado.notaEscala ?? selectedResultado.porcentaje / 20).toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">/ 5.0</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-2 ${
                        selectedResultado.estadoAprobacion === 'Aprobado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedResultado.estadoAprobacion}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Puntaje: {selectedResultado.puntuacionTotal} de {selectedResultado.puntuacionMaxima} pts ({selectedResultado.porcentaje.toFixed(1)}%)
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                    <p className="text-xs text-gray-400">Fecha de Entrega</p>
                    <p className="font-medium text-gray-800">{formatDateTime(selectedResultado.createdAt)}</p>
                    {selectedResultado.profesorNombre && (
                      <p className="text-xs text-gray-500">Evaluado por: {selectedResultado.profesorNombre}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Contenido: Preguntas y Retroalimentaciones */}
              {loadingDetalle ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" text="Cargando retroalimentación y respuestas..." />
                </div>
              ) : preguntas.length === 0 ? (
                <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-blue-900">
                    Calificación global registrada
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Esta entrega no cuenta con un desglose pregunta a pregunta disponible. Tu nota fue consolidada en el sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold px-1">
                    Desglose por Pregunta ({preguntas.length})
                  </h4>
                  {preguntas.map((pregunta, idx) => {
                    const calif = califMap.get(pregunta.id);
                    const respuestaEstudiante = respuestasParseadas[pregunta.id] ?? respuestasParseadas[String(pregunta.id)];
                    const puntajeObtenido = calif?.puntuacionObtenida ?? 0;
                    const esAciertoTotal = puntajeObtenido >= pregunta.puntuacion && pregunta.puntuacion > 0;
                    const esParcial = puntajeObtenido > 0 && puntajeObtenido < pregunta.puntuacion;

                    return (
                      <div
                        key={pregunta.id}
                        className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
                      >
                        {/* Cabecera de pregunta */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-sm font-medium text-gray-900">
                              {pregunta.enunciado}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              esAciertoTotal
                                ? 'bg-green-100 text-green-800'
                                : esParcial
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {puntajeObtenido} / {pregunta.puntuacion} pts
                            </span>
                          </div>
                        </div>

                        {/* Respuesta dada por el estudiante */}
                        <div className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1">
                          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                            Tu respuesta:
                          </p>
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {respuestaEstudiante ? respuestaEstudiante : <span className="italic text-gray-400">Sin respuesta registrada</span>}
                          </p>
                        </div>

                        {/* Retroalimentación del docente si existe */}
                        {calif?.retroalimentacion ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                            <div className="flex items-center gap-1.5 text-blue-900 font-semibold mb-1">
                              <MessageSquareQuote className="w-4 h-4 text-blue-600" />
                              Comentarios del docente:
                            </div>
                            <p className="text-blue-800 leading-relaxed pl-5">
                              {calif.retroalimentacion}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic pl-1">
                            Sin observaciones específicas para esta pregunta.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setFeedbackModalOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
};
