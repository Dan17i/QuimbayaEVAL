import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle,
  AlertTriangle, Save, FileText, Send,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
import { preguntasService, Pregunta } from '../services/preguntasService';
import { submissionsService } from '../services/submissionsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ROUTES } from '../constants/routes';

// Clave de localStorage para borrador
const draftKey = (evalId: number, userId: number) => `qeval_draft_${evalId}_${userId}`;

export const RealizarEvaluacionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const evaluacionId = Number(searchParams.get('id'));

  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [guardadoEstado, setGuardadoEstado] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);

  // Ref para acceder a respuestas actuales dentro del timer sin re-crear el efecto
  const respuestasRef = useRef(respuestas);
  respuestasRef.current = respuestas;

  // ── Carga inicial ────────────────────────────────────────────────
  useEffect(() => {
    if (!evaluacionId) { navigate(ROUTES.MIS_EVALUACIONES); return; }
    const cargar = async () => {
      setLoading(true);
      try {
        const [ev, pqs] = await Promise.all([
          evaluacionesService.getById(evaluacionId),
          preguntasService.getByEvaluacion(evaluacionId),
        ]);
        setEvaluacion(ev);
        setPreguntas(pqs);
        setTiempoRestante((ev.duracionMinutos ?? 60) * 60);

        // Restaurar borrador guardado localmente
        if (user?.id) {
          const saved = localStorage.getItem(draftKey(ev.id, user.id));
          if (saved) {
            try {
              setRespuestas(JSON.parse(saved));
              toast.info('Borrador restaurado', { description: 'Se recuperaron tus respuestas anteriores' });
            } catch { /* borrador corrupto, ignorar */ }
          }
        }
      } catch {
        toast.error('Error', { description: 'No se pudo cargar la evaluación' });
        navigate(ROUTES.MIS_EVALUACIONES);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [evaluacionId, user?.id]);

  // ── Cronómetro ───────────────────────────────────────────────────
  useEffect(() => {
    if (tiempoRestante <= 0 || loading) return;
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Envío automático al agotar el tiempo
          handleFinalizarReal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [tiempoRestante > 0, loading]); // solo re-crea cuando cambia el estado activo/inactivo

  // ── Autoguardado real cada 30 s ──────────────────────────────────
  useEffect(() => {
    if (loading || !evaluacion || !user?.id) return;
    const auto = setInterval(() => {
      guardarBorrador(respuestasRef.current);
    }, 30000);
    return () => clearInterval(auto);
  }, [loading, evaluacion?.id, user?.id]);

  // ── Guardar borrador (localStorage + indicador visual) ───────────
  const guardarBorrador = useCallback((resp: Record<number, string>) => {
    if (!evaluacion || !user?.id) return;
    try {
      localStorage.setItem(draftKey(evaluacion.id, user.id), JSON.stringify(resp));
      setGuardadoEstado('saved');
      setTimeout(() => setGuardadoEstado('idle'), 2500);
    } catch {
      setGuardadoEstado('error');
    }
  }, [evaluacion?.id, user?.id]);

  // ── Responder pregunta ───────────────────────────────────────────
  const handleRespuesta = (preguntaId: number, valor: string) => {
    setRespuestas(prev => {
      const next = { ...prev, [preguntaId]: valor };
      // Guardar borrador inmediatamente al responder
      if (evaluacion && user?.id) {
        try {
          localStorage.setItem(draftKey(evaluacion.id, user.id), JSON.stringify(next));
          setGuardadoEstado('saved');
          setTimeout(() => setGuardadoEstado('idle'), 2000);
        } catch { /* sin espacio en disco */ }
      }
      return next;
    });
  };

  // ── Envío final real ─────────────────────────────────────────────
  const handleFinalizarReal = useCallback(async () => {
    if (!evaluacion || !user) return;
    setSubmitting(true);
    setConfirmarFinalizar(false);
    try {
      await submissionsService.create({
        evaluacionId: evaluacion.id,
        respuestasJson: JSON.stringify(respuestasRef.current),
        estado: 'Enviada',
        intentoNumero: 1,
      });
      // Limpiar borrador local al enviar exitosamente
      if (user.id) localStorage.removeItem(draftKey(evaluacion.id, user.id));
      toast.success('Evaluación enviada', { description: 'Tus respuestas han sido registradas correctamente' });
      navigate(ROUTES.MIS_EVALUACIONES);
    } catch {
      toast.error('Error al enviar', { description: 'No se pudo enviar la evaluación. Intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  }, [evaluacion, user, navigate]);

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  // ── Loading / Empty ──────────────────────────────────────────────
  if (loading) return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <LoadingSpinner size="lg" text="Cargando evaluación..." />
      </div>
    </ProtectedRoute>
  );

  if (!evaluacion || preguntas.length === 0) return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <EmptyState icon={FileText} title="Evaluación no disponible" description="No se encontraron preguntas para esta evaluación" />
      </div>
    </ProtectedRoute>
  );

  const pregunta = preguntas[preguntaActual];
  const opciones: string[] = pregunta.opcionesJson ? JSON.parse(pregunta.opcionesJson) : [];
  const respondidas = Object.keys(respuestas).length;
  const progreso = (respondidas / preguntas.length) * 100;
  const sinResponder = preguntas.filter(p => !respuestas[p.id]).length;

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      {/* Fondo azul claro — favorece concentración (neuropsicología cromática) */}
      <div className="min-h-screen bg-blue-50">

        {/* Header sticky */}
        <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{evaluacion.nombre}</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Indicador de guardado */}
                <div className="flex items-center gap-1.5 text-xs min-w-[90px]">
                  {guardadoEstado === 'saving' && (
                    <><Save className="w-3.5 h-3.5 text-gray-400 animate-pulse" /><span className="text-gray-400">Guardando...</span></>
                  )}
                  {guardadoEstado === 'saved' && (
                    <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium">Guardado</span></>
                  )}
                  {guardadoEstado === 'error' && (
                    <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">Sin guardar</span></>
                  )}
                </div>

                {/* Cronómetro */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono font-semibold text-sm ${
                  tiempoRestante < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  {formatTiempo(tiempoRestante)}
                </div>

                {/* Botón Finalizar — siempre visible (Ley de Fitts) */}
                <Button
                  onClick={() => setConfirmarFinalizar(true)}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white hidden sm:flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Finalizar
                </Button>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{respondidas} de {preguntas.length} respondidas</span>
                <span>{Math.round(progreso)}%</span>
              </div>
              <Progress value={progreso} className="h-2" />
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

          {/* Alerta tiempo — amarillo (estimula atención sin urgencia del rojo) */}
          {tiempoRestante < 300 && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 font-medium">
                ¡Quedan menos de 5 minutos! La evaluación se enviará automáticamente al terminar el tiempo.
              </AlertDescription>
            </Alert>
          )}

          {/* Pregunta actual */}
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white px-3 py-1 text-sm">{preguntaActual + 1} / {preguntas.length}</Badge>
                <Badge variant="outline" className="text-xs capitalize text-blue-700 border-blue-300">
                  {pregunta.tipo.replace('_', ' ')}
                </Badge>
                {respuestas[pregunta.id] && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" /> Respondida
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base font-medium text-gray-900 mb-6 leading-relaxed">
                {pregunta.enunciado}
              </CardTitle>

              {(pregunta.tipo === 'seleccion_multiple' || pregunta.tipo === 'verdadero_falso') && opciones.length > 0 && (
                <RadioGroup
                  value={respuestas[pregunta.id] || ''}
                  onValueChange={v => handleRespuesta(pregunta.id, v)}
                  className="space-y-3"
                >
                  {opciones.map((op, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all
                        hover:bg-blue-50 hover:border-blue-400
                        ${respuestas[pregunta.id] === op
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white'
                        }`}
                      onClick={() => handleRespuesta(pregunta.id, op)}
                    >
                      <RadioGroupItem value={op} id={`op-${i}`} />
                      <Label htmlFor={`op-${i}`} className="flex-1 cursor-pointer text-gray-800">{op}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {(pregunta.tipo === 'respuesta_corta' || pregunta.tipo === 'ensayo') && (
                <Textarea
                  value={respuestas[pregunta.id] || ''}
                  onChange={e => handleRespuesta(pregunta.id, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="min-h-[150px] border-blue-200 focus:border-blue-500"
                />
              )}

              {/* Navegación entre preguntas */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPreguntaActual(p => Math.max(0, p - 1))}
                  disabled={preguntaActual === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
                {preguntaActual < preguntas.length - 1 ? (
                  <Button
                    onClick={() => setPreguntaActual(p => p + 1)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  // En la última pregunta también aparece el botón de finalizar
                  <Button
                    onClick={() => setConfirmarFinalizar(true)}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Finalizar y Enviar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navegación rápida */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Navegación rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                {preguntas.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPreguntaActual(i)}
                    title={`Pregunta ${i + 1}${respuestas[p.id] ? ' — respondida' : ' — sin responder'}`}
                    className={`aspect-square rounded-lg font-semibold text-xs transition-all
                      ${i === preguntaActual
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                        : respuestas[p.id]
                          ? 'bg-green-100 text-green-700 border-2 border-green-400'
                          : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-blue-400'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-400 mr-1 align-middle" />Respondida
                <span className="inline-block w-3 h-3 rounded bg-white border-2 border-gray-300 mx-1 ml-3 align-middle" />Sin responder
              </p>
            </CardContent>
          </Card>

          {/* Botón finalizar móvil (siempre visible en mobile) */}
          <div className="sm:hidden">
            <Button
              onClick={() => setConfirmarFinalizar(true)}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 py-3 text-base"
            >
              <Send className="w-5 h-5 mr-2" />
              Finalizar y Enviar Evaluación
            </Button>
          </div>

        </div>
      </div>

      {/* ── Diálogo de confirmación ── */}
      <Dialog open={confirmarFinalizar} onOpenChange={setConfirmarFinalizar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Finalizar evaluación
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>Estás a punto de enviar tu evaluación. Esta acción no se puede deshacer.</p>
              {sinResponder > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Tienes <strong>{sinResponder} pregunta{sinResponder > 1 ? 's' : ''}</strong> sin responder.</span>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span><strong>{respondidas}</strong> de <strong>{preguntas.length}</strong> preguntas respondidas.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarFinalizar(false)} disabled={submitting}>
              Revisar respuestas
            </Button>
            <Button
              onClick={handleFinalizarReal}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <><LoadingSpinner size="sm" /><span className="ml-2">Enviando...</span></>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Confirmar y Enviar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </ProtectedRoute>
  );
};
