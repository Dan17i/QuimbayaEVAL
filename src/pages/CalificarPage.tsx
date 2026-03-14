import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { submissionsService, Submission } from '../services/submissionsService';
import { preguntasService, Pregunta } from '../services/preguntasService';
import { evaluacionesService, Evaluacion } from '../services/evaluacionesService';
import { calificacionesService } from '../services/calificacionesService';
import { toast } from 'sonner';
import { ROUTES } from '../constants/routes';

export const CalificarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const evaluacionId = Number(searchParams.get('id'));

  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionActual, setSubmissionActual] = useState(0);
  const [puntajes, setPuntajes] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!evaluacionId) { navigate(ROUTES.EVALUACIONES); return; }
    const cargar = async () => {
      setLoading(true);
      try {
        const [ev, subs, pqs] = await Promise.all([
          evaluacionesService.getById(evaluacionId),
          submissionsService.getByEvaluacion(evaluacionId),
          preguntasService.getByEvaluacion(evaluacionId),
        ]);
        setEvaluacion(ev);
        setSubmissions(subs.filter(s => s.estado === 'Enviada' || s.estado === 'Calificada'));
        setPreguntas(pqs);
      } catch {
        toast.error('Error', { description: 'No se pudo cargar la evaluación' });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [evaluacionId]);

  const submission = submissions[submissionActual];
  const respuestas: Record<string, string> = submission?.respuestasJson
    ? JSON.parse(submission.respuestasJson) : {};

  const puntajeTotal = Object.values(puntajes).reduce((a, b) => a + b, 0);
  const puntajeMax = preguntas.reduce((a, p) => a + p.puntuacion, 0);
  const progreso = submissions.length > 0
    ? (submissions.filter(s => s.estado === 'Calificada').length / submissions.length) * 100 : 0;

  const handleGuardar = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      // Una calificacion por pregunta según el contrato del backend
      await Promise.all(
        preguntas.map(p =>
          calificacionesService.create({
            submissionId: submission.id,
            preguntaId: p.id,
            puntuacionObtenida: puntajes[p.id] ?? 0,
            retroalimentacion: feedback,
          })
        )
      );
      setSubmissions(prev => prev.map((s, i) =>
        i === submissionActual ? { ...s, estado: 'Calificada' } : s
      ));
      toast.success('Calificación guardada');
      setPuntajes({});
      setFeedback('');
    } catch { /* interceptor */ }
    finally { setSaving(false); }
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Estudiantes</h3>
        {loading ? <LoadingSpinner size="sm" /> : (
          <div className="space-y-2">
            {submissions.map((s, i) => (
              <div key={s.id} onClick={() => setSubmissionActual(i)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${i === submissionActual ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">Estudiante #{s.estudianteId}</span>
                  {s.estado === 'Calificada' && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">{s.estado}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">Progreso</p>
          <Progress value={progreso} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {submissions.filter(s => s.estado === 'Calificada').length} / {submissions.length} calificados
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calificar' }]}
        sidebar={sidebar}
      >
        {loading ? (
          <LoadingSpinner size="lg" text="Cargando submissions..." />
        ) : submissions.length === 0 ? (
          <EmptyState icon={FileText} title="Sin entregas" description="No hay estudiantes que hayan enviado esta evaluación" />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2>Calificar: {evaluacion?.nombre}</h2>
                <p className="text-gray-600 mt-1">Estudiante #{submission?.estudianteId}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSubmissionActual(p => Math.max(0, p - 1))} disabled={submissionActual === 0}>
                  <ChevronLeft className="w-4 h-4 mr-2" />Anterior
                </Button>
                <Button variant="outline" onClick={() => setSubmissionActual(p => Math.min(submissions.length - 1, p + 1))} disabled={submissionActual === submissions.length - 1}>
                  Siguiente<ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {preguntas.map((pregunta, idx) => {
              const opciones: string[] = pregunta.opcionesJson ? JSON.parse(pregunta.opcionesJson) : [];
              const respuesta = respuestas[pregunta.id] ?? '(sin respuesta)';
              return (
                <Card key={pregunta.id}>
                  <CardHeader>
                    <CardTitle>Pregunta {idx + 1} — {pregunta.puntuacion} pts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">{pregunta.enunciado}</div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Respuesta del estudiante:</p>
                      <div className="p-3 border rounded-lg text-sm">{respuesta}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">Puntaje:</label>
                      <input type="number" min={0} max={pregunta.puntuacion} step={0.5}
                        value={puntajes[pregunta.id] ?? 0}
                        onChange={e => setPuntajes(prev => ({ ...prev, [pregunta.id]: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">/ {pregunta.puntuacion}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Retroalimentación general</label>
                  <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Comentarios para el estudiante..." />
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm">Total: <span className="font-semibold">{puntajeTotal} / {puntajeMax}</span></p>
                  <Button onClick={handleGuardar} disabled={saving} className="flex items-center gap-2">
                    <Send className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar Calificación'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};
