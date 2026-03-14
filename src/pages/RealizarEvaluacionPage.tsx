import React, { useState, useEffect, useCallback } from 'react';
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
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Save, FileText } from 'lucide-react';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
import { preguntasService, Pregunta } from '../services/preguntasService';
import { submissionsService } from '../services/submissionsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ROUTES } from '../constants/routes';

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
  const [guardadoAutomatico, setGuardadoAutomatico] = useState(false);

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
      } catch {
        toast.error('Error', { description: 'No se pudo cargar la evaluación' });
        navigate(ROUTES.MIS_EVALUACIONES);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [evaluacionId]);

  // Cronómetro
  useEffect(() => {
    if (tiempoRestante <= 0 || loading) return;
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) { clearInterval(timer); handleFinalizar(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [tiempoRestante, loading]);

  // Autoguardado cada 30s
  useEffect(() => {
    if (loading) return;
    const auto = setInterval(() => {
      setGuardadoAutomatico(true);
      setTimeout(() => setGuardadoAutomatico(false), 2000);
    }, 30000);
    return () => clearInterval(auto);
  }, [loading]);

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const handleRespuesta = (preguntaId: number, valor: string) =>
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));

  const handleFinalizar = useCallback(async () => {
    if (!evaluacion || !user) return;
    if (!window.confirm('¿Estás seguro de que deseas finalizar y enviar la evaluación?')) return;
    setSubmitting(true);
    try {
      await submissionsService.create({
        evaluacionId: evaluacion.id,
        estudianteId: Number(user.id),
        respuestasJson: JSON.stringify(respuestas),
        estado: 'Enviada',
        intentoNumero: 1,
      });
      toast.success('Evaluación enviada', { description: 'Tus respuestas han sido registradas' });
      navigate(ROUTES.MIS_EVALUACIONES);
    } catch {
      toast.error('Error', { description: 'No se pudo enviar la evaluación' });
    } finally {
      setSubmitting(false);
    }
  }, [evaluacion, user, respuestas, navigate]);

  if (loading) return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando evaluación..." />
      </div>
    </ProtectedRoute>
  );

  if (!evaluacion || preguntas.length === 0) return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState icon={FileText} title="Evaluación no disponible" description="No se encontraron preguntas para esta evaluación" />
      </div>
    </ProtectedRoute>
  );

  const pregunta = preguntas[preguntaActual];
  const opciones: string[] = pregunta.opcionesJson ? JSON.parse(pregunta.opcionesJson) : [];
  const respondidas = Object.keys(respuestas).length;
  const progreso = (respondidas / preguntas.length) * 100;

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg truncate">{evaluacion.nombre}</h1>
              </div>
              <div className="flex items-center gap-4">
                {guardadoAutomatico && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Save className="w-4 h-4" /><span className="hidden sm:inline">Guardado</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tiempoRestante < 300 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold text-sm">{formatTiempo(tiempoRestante)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{respondidas} de {preguntas.length} respondidas</span>
                <span>{Math.round(progreso)}%</span>
              </div>
              <Progress value={progreso} className="h-2" />
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {tiempoRestante < 300 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">Quedan menos de 5 minutos.</AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white px-3 py-1">{preguntaActual + 1}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{pregunta.tipo.replace('_', ' ')}</Badge>
                {respuestas[pregunta.id] && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base mb-6">{pregunta.enunciado}</CardTitle>

              {(pregunta.tipo === 'seleccion_multiple' || pregunta.tipo === 'verdadero_falso') && opciones.length > 0 && (
                <RadioGroup value={respuestas[pregunta.id] || ''} onValueChange={v => handleRespuesta(pregunta.id, v)} className="space-y-3">
                  {opciones.map((op, i) => (
                    <div key={i}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 ${respuestas[pregunta.id] === op ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => handleRespuesta(pregunta.id, op)}
                    >
                      <RadioGroupItem value={op} id={`op-${i}`} />
                      <Label htmlFor={`op-${i}`} className="flex-1 cursor-pointer">{op}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {(pregunta.tipo === 'respuesta_corta' || pregunta.tipo === 'ensayo') && (
                <Textarea
                  value={respuestas[pregunta.id] || ''}
                  onChange={e => handleRespuesta(pregunta.id, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="min-h-[150px]"
                />
              )}

              <div className="flex justify-between mt-6 pt-4 border-t gap-3">
                <Button variant="outline" onClick={() => setPreguntaActual(p => Math.max(0, p - 1))} disabled={preguntaActual === 0}>
                  <ChevronLeft className="w-4 h-4 mr-2" />Anterior
                </Button>
                {preguntaActual === preguntas.length - 1 ? (
                  <Button onClick={handleFinalizar} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />{submitting ? 'Enviando...' : 'Finalizar y Enviar'}
                  </Button>
                ) : (
                  <Button onClick={() => setPreguntaActual(p => Math.min(preguntas.length - 1, p + 1))}>
                    Siguiente<ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Navegación Rápida</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                {preguntas.map((p, i) => (
                  <button key={p.id} onClick={() => setPreguntaActual(i)}
                    className={`aspect-square rounded-lg font-semibold text-sm transition-all ${i === preguntaActual ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : respuestas[p.id] ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-700 border-2 border-gray-300'}`}
                  >{i + 1}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};
