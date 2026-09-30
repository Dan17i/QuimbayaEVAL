import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/Badge';
import {
  ChevronLeft, ChevronRight, Save, Send, CheckCircle2,
  AlertCircle, FileText, User, Search, Clock, Sparkles,
  MessageSquareQuote, Check, ArrowRight,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { submissionsService, Submission } from '../services/submissionsService';
import { preguntasService, Pregunta } from '../services/preguntasService';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
import { calificacionesService, Calificacion } from '../services/calificacionesService';
import { usersService, UserDTO } from '../services/usersService';
import { toast } from 'sonner';
import { ROUTES } from '../constants/routes';

export const CalificarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawId = searchParams.get('id') || searchParams.get('evaluacionId');
  const evaluacionId = rawId ? Number(rawId) : 0;

  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [usuarios, setUsuarios] = useState<Record<number, UserDTO>>({});
  const [loading, setLoading] = useState(true);
  const [submissionActual, setSubmissionActual] = useState(0);

  // Estados de calificación del estudiante actual
  const [puntajes, setPuntajes] = useState<Record<number, number>>({});
  const [retroalimentaciones, setRetroalimentaciones] = useState<Record<number, string>>({});
  const [feedbackGeneral, setFeedbackGeneral] = useState('');
  const [calificacionesExistentes, setCalificacionesExistentes] = useState<Record<number, Calificacion>>({});
  const [loadingCalifs, setLoadingCalifs] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtros del sidebar
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [filtroEstadoSidebar, setFiltroEstadoSidebar] = useState<'todos' | 'Pendiente' | 'Calificada'>('todos');

  // Carga inicial
  useEffect(() => {
    if (!evaluacionId) { navigate(ROUTES.EVALUACIONES); return; }
    const cargar = async () => {
      setLoading(true);
      try {
        const [ev, subs, pqs, usrs] = await Promise.all([
          evaluacionesService.getById(evaluacionId),
          submissionsService.getByEvaluacion(evaluacionId),
          preguntasService.getByEvaluacion(evaluacionId),
          usersService.getAll().catch(() => [] as UserDTO[]),
        ]);
        setEvaluacion(ev);
        setSubmissions(subs.filter(s => s.estado === 'Enviada' || s.estado === 'Calificada'));
        setPreguntas(pqs);

        const uMap: Record<number, UserDTO> = {};
        usrs.forEach(u => { uMap[u.id] = u; });
        setUsuarios(uMap);
      } catch {
        toast.error('Error', { description: 'No se pudo cargar la evaluación y sus entregas' });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [evaluacionId]);

  const submission = submissions[submissionActual];

  // Parsear respuestas del estudiante activo
  const respuestas: Record<string, string> = useMemo(() => {
    if (!submission?.respuestasJson) return {};
    try {
      return JSON.parse(submission.respuestasJson);
    } catch {
      return {};
    }
  }, [submission]);

  // Cargar calificaciones existentes al cambiar de estudiante
  useEffect(() => {
    if (!submission) return;
    const cargarCalifs = async () => {
      setLoadingCalifs(true);
      try {
        const list = await calificacionesService.getBySubmission(submission.id);
        const mapPuntajes: Record<number, number> = {};
        const mapFeedbacks: Record<number, string> = {};
        const mapExistentes: Record<number, Calificacion> = {};

        list.forEach(c => {
          mapPuntajes[c.preguntaId] = c.puntuacionObtenida;
          if (c.retroalimentacion) {
            mapFeedbacks[c.preguntaId] = c.retroalimentacion;
          }
          mapExistentes[c.preguntaId] = c;
        });

        // Si es una entrega nueva sin calificar, sugerir autocalificación preliminar
        if (list.length === 0) {
          preguntas.forEach(p => {
            const rEstudiante = respuestas[p.id];
            if (rEstudiante && p.respuestaCorrectaJson) {
              try {
                const rCorrecta = JSON.parse(p.respuestaCorrectaJson);
                if (String(rEstudiante).trim().toLowerCase() === String(rCorrecta).trim().toLowerCase()) {
                  mapPuntajes[p.id] = p.puntuacion;
                } else {
                  mapPuntajes[p.id] = 0;
                }
              } catch {
                if (String(rEstudiante).trim().toLowerCase() === String(p.respuestaCorrectaJson).trim().toLowerCase()) {
                  mapPuntajes[p.id] = p.puntuacion;
                } else {
                  mapPuntajes[p.id] = 0;
                }
              }
            } else {
              mapPuntajes[p.id] = 0;
            }
          });
        }

        setPuntajes(mapPuntajes);
        setRetroalimentaciones(mapFeedbacks);
        setCalificacionesExistentes(mapExistentes);
        setFeedbackGeneral('');
      } catch {
        // En caso de fallo de red
      } finally {
        setLoadingCalifs(false);
      }
    };
    cargarCalifs();
  }, [submission?.id, preguntas, respuestas]);

  // Cálculos dinámicos
  const puntajeTotal = useMemo(() => {
    return Object.values(puntajes).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [puntajes]);

  const puntajeMax = useMemo(() => {
    return preguntas.reduce((a, p) => a + p.puntuacion, 0) || 1;
  }, [preguntas]);

  const notaEscalaSena = useMemo(() => {
    return ((puntajeTotal / puntajeMax) * 5.0).toFixed(1);
  }, [puntajeTotal, puntajeMax]);

  const esAprobado = Number(notaEscalaSena) >= 3.0;

  const progreso = useMemo(() => {
    if (!submissions.length) return 0;
    const calificados = submissions.filter(s => s.estado === 'Calificada').length;
    return (calificados / submissions.length) * 100;
  }, [submissions]);

  // Atajos rápidos de calificación por pregunta
  const asignarPuntajeRapido = (preguntaId: number, maxPuntos: number, factor: number) => {
    const valor = Math.round(maxPuntos * factor * 10) / 10;
    setPuntajes(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const agregarComentarioRapido = (preguntaId: number, texto: string) => {
    setRetroalimentaciones(prev => {
      const actual = prev[preguntaId] || '';
      return {
        ...prev,
        [preguntaId]: actual ? `${actual}. ${texto}` : texto,
      };
    });
  };

  // Guardar calificación
  const handleGuardar = async (avanzar = false) => {
    if (!submission) return;
    setSaving(true);
    try {
      // 1. Guardar o actualizar calificaciones por cada pregunta
      await Promise.all(
        preguntas.map(async (p) => {
          const califExistente = calificacionesExistentes[p.id];
          const puntuacionObtenida = puntajes[p.id] ?? 0;
          const retroalimentacion =
            (retroalimentaciones[p.id] && retroalimentaciones[p.id].trim()) ||
            feedbackGeneral.trim() ||
            '';

          if (califExistente) {
            return calificacionesService.update(califExistente.id, {
              submissionId: submission.id,
              preguntaId: p.id,
              puntuacionObtenida,
              retroalimentacion,
            });
          } else {
            return calificacionesService.create({
              submissionId: submission.id,
              preguntaId: p.id,
              puntuacionObtenida,
              retroalimentacion,
            });
          }
        })
      );

      // 2. Marcar la submission como 'Calificada' en el backend
      try {
        await submissionsService.update(submission.id, {
          estado: 'Calificada',
          evaluacionId: submission.evaluacionId,
          intentoNumero: submission.intentoNumero,
          respuestasJson: submission.respuestasJson,
        });
      } catch {
        // En caso de que el backend ya lo marque automáticamente por trigger/servicio
      }

      // 3. Actualizar estado local reactivo
      setSubmissions(prev =>
        prev.map((s, i) => (i === submissionActual ? { ...s, estado: 'Calificada' } : s))
      );

      toast.success('Calificación guardada exitosamente');

      if (avanzar && submissionActual < submissions.length - 1) {
        setSubmissionActual(prev => prev + 1);
      }
    } catch {
      toast.error('Error al guardar la calificación');
    } finally {
      setSaving(false);
    }
  };

  // Submissions filtradas para el sidebar
  const submissionsFiltradas = useMemo(() => {
    return submissions.map((s, indexOriginal) => ({ s, indexOriginal })).filter(({ s }) => {
      const u = usuarios[s.estudianteId];
      const nombre = u?.name || `Estudiante #${s.estudianteId}`;
      const email = u?.email || '';

      const coincideFiltro =
        filtroEstadoSidebar === 'todos' ||
        (filtroEstadoSidebar === 'Calificada' && s.estado === 'Calificada') ||
        (filtroEstadoSidebar === 'Pendiente' && s.estado !== 'Calificada');

      if (!coincideFiltro) return false;

      if (!busquedaEstudiante.trim()) return true;
      const q = busquedaEstudiante.toLowerCase().trim();
      return nombre.toLowerCase().includes(q) || email.toLowerCase().includes(q) || String(s.estudianteId).includes(q);
    });
  }, [submissions, usuarios, filtroEstadoSidebar, busquedaEstudiante]);

  // Sidebar con diseño centrado en el usuario
  const sidebar = (
    <Card className="h-full flex flex-col shadow-xs">
      <CardContent className="pt-5 space-y-4 flex-1 flex flex-col">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-gray-900">Entregas de Estudiantes</h3>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {submissions.length} total
            </span>
          </div>
          <p className="text-xs text-gray-500">Selecciona para calificar o editar notas</p>
        </div>

        {/* Buscador de estudiantes */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={busquedaEstudiante}
            onChange={(e) => setBusquedaEstudiante(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="pl-8 text-xs h-8 bg-white"
          />
        </div>

        {/* Píldoras de filtro */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px]">
          {(['todos', 'Pendiente', 'Calificada'] as const).map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstadoSidebar(estado)}
              className={`py-1 text-center font-medium rounded-md transition-all ${
                filtroEstadoSidebar === estado
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {estado === 'todos' ? 'Todos' : estado === 'Pendiente' ? 'Pendientes' : 'Listas'}
            </button>
          ))}
        </div>

        {/* Lista interactiva de entregas */}
        {loading ? (
          <div className="py-6 flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : submissionsFiltradas.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center italic">
            No hay entregas que coincidan con el filtro
          </p>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {submissionsFiltradas.map(({ s, indexOriginal }) => {
              const u = usuarios[s.estudianteId];
              const nombre = u?.name || `Estudiante #${s.estudianteId}`;
              const email = u?.email || '';
              const esActiva = indexOriginal === submissionActual;
              const estaCalificada = s.estado === 'Calificada';

              return (
                <div
                  key={s.id}
                  onClick={() => setSubmissionActual(indexOriginal)}
                  className={`p-2.5 border rounded-xl cursor-pointer transition-all ${
                    esActiva
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${esActiva ? 'text-blue-900' : 'text-gray-800'}`}>
                        {nombre}
                      </p>
                      {email && (
                        <p className="text-[10px] text-gray-400 truncate">{email}</p>
                      )}
                    </div>
                    {estaCalificada ? (
                      <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Lista
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Revisar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Barra de progreso de revisión */}
        <div className="pt-3 border-t space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progreso de calificación:</span>
            <span className="font-bold text-gray-800">{Math.round(progreso)}%</span>
          </div>
          <Progress value={progreso} className="h-2" />
          <p className="text-[11px] text-gray-400">
            {submissions.filter(s => s.estado === 'Calificada').length} de {submissions.length} estudiantes calificados
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const estudianteActual = submission ? usuarios[submission.estudianteId] : null;

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Evaluaciones', href: ROUTES.EVALUACIONES },
          { label: 'Calificar' },
        ]}
        sidebar={sidebar}
      >
        {loading ? (
          <LoadingSpinner size="lg" text="Cargando panel de calificación..." />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin entregas para calificar"
            description="Ningún estudiante ha enviado sus respuestas para esta evaluación todavía."
          />
        ) : (
          <div className="space-y-5">
            {/* Cabecera Ergonómica de Calificación */}
            <div className="bg-white border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    {evaluacion?.tipo || 'Evaluación'}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">
                    Entrega #{submissionActual + 1} de {submissions.length}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-snug truncate">
                  {evaluacion?.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">
                    {estudianteActual?.name || `Estudiante #${submission?.estudianteId}`}
                  </span>
                  {estudianteActual?.email && (
                    <span className="text-xs text-gray-400 font-normal">
                      ({estudianteActual.email})
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Nota y Estado de Aprobación */}
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium leading-none">
                    Nota SENA
                  </p>
                  <div className="flex items-baseline gap-1 mt-1 justify-end">
                    <span className={`text-3xl font-extrabold ${esAprobado ? 'text-green-600' : 'text-red-500'}`}>
                      {notaEscalaSena}
                    </span>
                    <span className="text-xs text-gray-400">/ 5.0</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {puntajeTotal} de {puntajeMax} pts
                  </p>
                </div>

                <div className="border-l pl-3 flex flex-col justify-center gap-1.5">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold text-center ${
                      esAprobado
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {esAprobado ? 'Aprobado' : 'Reprobado'}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSubmissionActual(p => Math.max(0, p - 1))}
                      disabled={submissionActual === 0}
                      title="Estudiante anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSubmissionActual(p => Math.min(submissions.length - 1, p + 1))}
                      disabled={submissionActual === submissions.length - 1}
                      title="Estudiante siguiente"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Preguntas con Controles de Calificación */}
            {loadingCalifs ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" text="Cargando respuestas del estudiante..." />
              </div>
            ) : (
              <div className="space-y-4">
                {preguntas.map((pregunta, idx) => {
                  const respuesta = respuestas[pregunta.id] ?? '';
                  const puntajeActual = puntajes[pregunta.id] ?? 0;
                  const comentarioPregunta = retroalimentaciones[pregunta.id] ?? '';

                  // Parsear respuesta correcta si existe
                  let respuestaCorrectaTexto: string | null = null;
                  if (pregunta.respuestaCorrectaJson) {
                    try {
                      const parsed = JSON.parse(pregunta.respuestaCorrectaJson);
                      respuestaCorrectaTexto = String(parsed);
                    } catch {
                      respuestaCorrectaTexto = pregunta.respuestaCorrectaJson;
                    }
                  }

                  const coincideConEsperada =
                    respuestaCorrectaTexto &&
                    respuesta.trim().toLowerCase() === respuestaCorrectaTexto.trim().toLowerCase();

                  return (
                    <Card key={pregunta.id} className="border-gray-200 shadow-xs overflow-hidden">
                      {/* Cabecera de pregunta */}
                      <CardHeader className="bg-gray-50/70 border-b border-gray-100 py-3 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-gray-700 capitalize">
                              {pregunta.tipo ? pregunta.tipo.replace('_', ' ') : 'Pregunta'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-600 bg-white border px-2.5 py-0.5 rounded-full">
                            Valor: {pregunta.puntuacion} pts
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* Enunciado */}
                        <div className="text-sm font-medium text-gray-900 leading-relaxed">
                          {pregunta.enunciado}
                        </div>

                        {/* Respuesta dada por el estudiante */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Respuesta del estudiante:
                          </label>
                          <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-sm text-gray-900 leading-relaxed font-sans">
                            {respuesta ? (
                              <p className="whitespace-pre-wrap">{respuesta}</p>
                            ) : (
                              <span className="italic text-gray-400">Sin respuesta registrada por el estudiante</span>
                            )}
                          </div>
                        </div>

                        {/* Comparador con respuesta esperada si aplica */}
                        {respuestaCorrectaTexto && (
                          <div className="bg-green-50/60 border border-green-200 rounded-lg p-2.5 text-xs text-green-900 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-green-900">Respuesta esperada: </span>
                              <span className="text-green-800">{respuestaCorrectaTexto}</span>
                            </div>
                            {coincideConEsperada && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3.5 h-3.5" /> Coincide
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sección de asignación de puntaje y botones ergonómicos */}
                        <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">Puntaje asignado:</span>
                            <Input
                              type="number"
                              min={0}
                              max={pregunta.puntuacion}
                              step={0.5}
                              value={puntajeActual}
                              onChange={(e) => {
                                const val = Math.min(
                                  pregunta.puntuacion,
                                  Math.max(0, Number(e.target.value))
                                );
                                setPuntajes((prev) => ({ ...prev, [pregunta.id]: val }));
                              }}
                              className="w-20 text-center font-bold text-sm h-8 bg-white"
                            />
                            <span className="text-xs text-gray-500">/ {pregunta.puntuacion} pts</span>
                          </div>

                          {/* Atajos de teclado/clic rápido (Ley de Fitts) */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-700"
                              onClick={() => asignarPuntajeRapido(pregunta.id, pregunta.puntuacion, 0)}
                            >
                              0 pts
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 hover:bg-amber-50 hover:text-amber-700"
                              onClick={() => asignarPuntajeRapido(pregunta.id, pregunta.puntuacion, 0.5)}
                            >
                              50% ({pregunta.puntuacion / 2} pts)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-semibold"
                              onClick={() => asignarPuntajeRapido(pregunta.id, pregunta.puntuacion, 1)}
                            >
                              Máximo ({pregunta.puntuacion} pts)
                            </Button>
                          </div>
                        </div>

                        {/* Retroalimentación individual por pregunta */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                              <MessageSquareQuote className="w-3.5 h-3.5 text-blue-600" />
                              Observaciones específicas para esta pregunta:
                            </label>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => agregarComentarioRapido(pregunta.id, '¡Excelente argumentación!')}
                                className="text-[10px] text-gray-500 hover:text-blue-700 bg-white border rounded px-1.5 py-0.5 transition-colors"
                              >
                                + Excelente
                              </button>
                              <button
                                type="button"
                                onClick={() => agregarComentarioRapido(pregunta.id, 'Respuesta incompleta')}
                                className="text-[10px] text-gray-500 hover:text-amber-700 bg-white border rounded px-1.5 py-0.5 transition-colors"
                              >
                                + Incompleta
                              </button>
                            </div>
                          </div>
                          <Textarea
                            value={comentarioPregunta}
                            onChange={(e) =>
                              setRetroalimentaciones((prev) => ({
                                ...prev,
                                [pregunta.id]: e.target.value,
                              }))
                            }
                            rows={2}
                            placeholder="Escribe comentarios formativos para orientar al estudiante..."
                            className="text-xs bg-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Tarjeta de Consolidación y Acciones Finales */}
                <Card className="border-blue-200 bg-gradient-to-b from-white to-blue-50/30 shadow-sm">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Retroalimentación global de la prueba (Opcional):
                      </label>
                      <Textarea
                        value={feedbackGeneral}
                        onChange={(e) => setFeedbackGeneral(e.target.value)}
                        rows={2}
                        placeholder="Mensaje global de felicitación o recomendaciones para el estudiante..."
                        className="bg-white text-xs"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Nota final calculada: </span>
                        <span className={`text-lg font-extrabold ${esAprobado ? 'text-green-700' : 'text-red-600'}`}>
                          {notaEscalaSena} / 5.0
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({puntajeTotal} de {puntajeMax} pts)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => handleGuardar(false)}
                          disabled={saving}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          onClick={() => handleGuardar(true)}
                          disabled={saving}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                          <Send className="w-4 h-4" />
                          {saving ? 'Guardando...' : 'Guardar y Siguiente'}
                          <ArrowRight className="w-4 h-4 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};
