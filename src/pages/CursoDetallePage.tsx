import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Clock, CheckCircle, AlertCircle,
  MessageSquare, Play, FileDown, ChevronLeft, Star,
} from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { pqrsService, TipoPQRS } from '../services/pqrsService';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { formatDateTime } from '../utils/date';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';

// ── PDF de constancia ────────────────────────────────────────────────────────
function generarPDFConstancia(params: {
  radicado: string;
  tipo: string;
  asunto: string;
  descripcion: string;
  curso: string;
  evaluacion: string;
  nombre: string;
  email: string;
  fecha: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Constancia PQRS ${params.radicado}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .logo { font-size: 22px; font-weight: bold; color: #2563eb; }
        .radicado { font-size: 11px; color: #6b7280; text-align: right; }
        .radicado strong { font-size: 14px; color: #1a1a1a; display: block; }
        h2 { font-size: 16px; margin-bottom: 20px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
        .section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .section h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.08em; margin-bottom: 10px; }
        .row { display: flex; gap: 8px; margin-bottom: 6px; }
        .label { font-weight: bold; min-width: 130px; color: #374151; }
        .value { color: #1a1a1a; }
        .desc { margin-top: 8px; line-height: 1.6; color: #374151; }
        .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; }
        .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">QuimbayaEVAL</div>
        <div class="radicado">
          Radicado<strong>${params.radicado}</strong>
          ${params.fecha}
        </div>
      </div>

      <h2>Constancia de Radicación PQRS</h2>

      <div class="section">
        <h3>Datos del Solicitante</h3>
        <div class="row"><span class="label">Nombre:</span><span class="value">${params.nombre}</span></div>
        <div class="row"><span class="label">Correo:</span><span class="value">${params.email}</span></div>
      </div>

      <div class="section">
        <h3>Detalle de la Solicitud</h3>
        <div class="row"><span class="label">Tipo:</span><span class="value"><span class="badge">${params.tipo}</span></span></div>
        <div class="row"><span class="label">Asunto:</span><span class="value">${params.asunto}</span></div>
        <div class="row"><span class="label">Curso:</span><span class="value">${params.curso}</span></div>
        ${params.evaluacion ? `<div class="row"><span class="label">Evaluación:</span><span class="value">${params.evaluacion}</span></div>` : ''}
        <p class="desc"><strong>Descripción:</strong><br/>${params.descripcion}</p>
      </div>

      <div class="section">
        <h3>Estado</h3>
        <div class="row"><span class="label">Estado actual:</span><span class="value">Pendiente de revisión</span></div>
        <div class="row"><span class="label">Tiempo de respuesta:</span><span class="value">Máximo 5 días hábiles</span></div>
      </div>

      <div class="footer">
        Este documento es una constancia de radicación. Guárdelo como soporte de su solicitud.<br/>
        Sistema de Gestión de Evaluaciones Académicas — SENA Quimbaya, Quindío
      </div>
    </body>
    </html>
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = (globalThis as any).open('', '_blank', 'width=800,height=900');
  if (!win) { toast.error('Activa las ventanas emergentes para generar el PDF'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ── Componente principal ─────────────────────────────────────────────────────
export const CursoDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cursoId = Number(id);

  const { cursos, loading: loadingCursos } = useCursos();
  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();

  const curso = useMemo(() => cursos.find(c => c.id === cursoId), [cursos, cursoId]);

  const evalsCurso = useMemo(() =>
    evaluaciones.filter(e => e.cursoId === cursoId),
    [evaluaciones, cursoId]
  );

  const evalsAbiertas = useMemo(() => evalsCurso.filter(e => e.estado === 'Activa'), [evalsCurso]);
  const evalsProximas = useMemo(() => evalsCurso.filter(e => e.estado === 'Programada'), [evalsCurso]);
  const evalsCerradas = useMemo(() => evalsCurso.filter(e => e.estado === 'Cerrada'), [evalsCurso]);

  // Resultados del estudiante para este curso
  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(true);

  useEffect(() => {
    resultadosService.getMisResultados()
      .then(all => {
        // Filtramos por nombre de curso (el backend devuelve cursoNombre)
        if (curso) {
          setResultados(all.filter(r => r.cursoNombre === curso.nombre));
        } else {
          setResultados(all);
        }
      })
      .catch(() => { /* interceptor */ })
      .finally(() => setLoadingResultados(false));
  }, [curso]);

  // PQRS modal
  const [pqrsOpen, setPqrsOpen] = useState(false);
  const [pqrsEvalId, setPqrsEvalId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoPQRS>('Petición');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [constancia, setConstancia] = useState<{ radicado: string; tipo: string; asunto: string; descripcion: string; evalNombre: string } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const field = (setter: (v: string) => void) => (e: any) => setter(e.target.value);

  const abrirPQRS = (evalId?: number) => {
    setPqrsEvalId(evalId ?? null);
    setAsunto('');
    setDescripcion('');
    setTipo('Petición');
    setConstancia(null);
    setPqrsOpen(true);
  };

  const handleEnviarPQRS = async () => {
    if (!asunto.trim() || !descripcion.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    setSubmitting(true);
    try {
      const result = await pqrsService.create({
        tipo,
        asunto: asunto.trim(),
        descripcion: descripcion.trim(),
        cursoId,
      });

      const evalNombre = pqrsEvalId
        ? (evalsCurso.find(e => e.id === pqrsEvalId)?.name ?? '')
        : '';

      const radicado = `PQRS-${result.id}-${new Date().getFullYear()}`;
      setConstancia({ radicado, tipo, asunto: asunto.trim(), descripcion: descripcion.trim(), evalNombre });
      toast.success('PQRS enviada correctamente');
    } catch {
      // interceptor maneja el error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!constancia || !user || !curso) return;
    generarPDFConstancia({
      radicado: constancia.radicado,
      tipo: constancia.tipo,
      asunto: constancia.asunto,
      descripcion: constancia.descripcion,
      curso: `${curso.codigo} - ${curso.nombre}`,
      evaluacion: constancia.evalNombre,
      nombre: user.name,
      email: user.email,
      fecha: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
  };

  const loading = loadingCursos || loadingEvals;

  if (!loading && !curso) {
    return (
      <ProtectedRoute allowedRoles={['estudiante']}>
        <Layout breadcrumbs={[{ label: 'Inicio', href: ROUTES.DASHBOARD }, { label: 'Curso no encontrado' }]}>
          <EmptyState icon={AlertCircle} title="Curso no encontrado" description="Este curso no existe o no tienes acceso." actionLabel="Volver" onAction={() => navigate(ROUTES.DASHBOARD)} />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[
        { label: 'Inicio', href: ROUTES.DASHBOARD },
        { label: curso?.nombre ?? 'Cargando...' },
      ]}>
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Cabecera del curso */}
          <div>
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a mis cursos
            </button>

            {loading ? (
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-mono text-gray-400 mb-1">{curso!.codigo}</p>
                  <h1 className="text-2xl font-bold text-gray-900">{curso!.nombre}</h1>
                  {curso!.descripcion && (
                    <p className="text-gray-500 text-sm mt-1">{curso!.descripcion}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => abrirPQRS()}
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar PQRS
                </Button>
              </div>
            )}
          </div>

          {/* Evaluaciones abiertas */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pendientes
              {evalsAbiertas.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{evalsAbiertas.length}</span>
              )}
            </h2>

            {loading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : evalsAbiertas.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No tienes evaluaciones pendientes en este curso.</p>
            ) : (
              <div className="space-y-2">
                {evalsAbiertas.map(ev => (
                  <div key={ev.id} className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{ev.name}</p>
                      <p className="text-xs text-orange-600 mt-0.5">Cierra: {formatDateTime(ev.deadline)}</p>
                      {ev.duracion && <p className="text-xs text-gray-500">Duración: {ev.duracion}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => abrirPQRS(ev.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded"
                        title="Enviar PQRS sobre esta evaluación"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white gap-1"
                        onClick={() => navigate(`${ROUTES.REALIZAR_EVALUACION}?id=${ev.id}`)}
                      >
                        <Play className="w-3 h-3" /> Iniciar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Próximas */}
          {!loading && evalsProximas.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                Próximas
              </h2>
              <div className="space-y-2">
                {evalsProximas.map(ev => (
                  <div key={ev.id} className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{ev.name}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Disponible: {formatDateTime(ev.deadline)}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">Programada</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cerradas */}
          {!loading && evalsCerradas.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                Finalizadas
              </h2>
              <div className="space-y-2">
                {evalsCerradas.map(ev => (
                  <div key={ev.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 opacity-75">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 truncate">{ev.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ev.tipo}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Cerrada</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mis calificaciones en este curso */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Mis Calificaciones
            </h2>

            {loadingResultados ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : resultados.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Aún no tienes evaluaciones calificadas en este curso.</p>
            ) : (
              <div className="space-y-2">
                {resultados.map(r => {
                  const aprobado = r.estadoAprobacion === 'Aprobado';
                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-4 ${
                        aprobado
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{r.evaluacionNombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.puntuacionTotal} / {r.puntuacionMaxima} pts · {r.porcentaje.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-lg font-bold ${aprobado ? 'text-green-700' : 'text-red-600'}`}>
                          {r.notaEscala.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {r.estadoAprobacion}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* ── Modal PQRS ── */}
        <Dialog open={pqrsOpen} onOpenChange={open => { if (!open) { setPqrsOpen(false); setConstancia(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                {constancia ? 'PQRS Enviada' : 'Nueva PQRS'}
              </DialogTitle>
              <DialogDescription>
                {constancia
                  ? `Radicado: ${constancia.radicado}`
                  : `Curso: ${curso?.codigo} — ${curso?.nombre}${pqrsEvalId ? ` · ${evalsCurso.find(e => e.id === pqrsEvalId)?.name ?? ''}` : ''}`
                }
              </DialogDescription>
            </DialogHeader>

            {constancia ? (
              /* Vista de confirmación */
              <div className="space-y-4 py-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                  Tu solicitud fue radicada exitosamente. Recibirás respuesta en un máximo de 5 días hábiles.
                </div>
                <div className="text-sm space-y-1 text-gray-700">
                  <p><span className="font-medium">Tipo:</span> {constancia.tipo}</p>
                  <p><span className="font-medium">Asunto:</span> {constancia.asunto}</p>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => { setPqrsOpen(false); setConstancia(null); }}>Cerrar</Button>
                  <Button onClick={handleDescargarPDF} className="gap-2">
                    <FileDown className="w-4 h-4" /> Descargar constancia PDF
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              /* Formulario */
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Tipo de solicitud</Label>
                  <Select value={tipo} onValueChange={v => setTipo(v as TipoPQRS)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petición">Petición</SelectItem>
                      <SelectItem value="Queja">Queja</SelectItem>
                      <SelectItem value="Reclamo">Reclamo</SelectItem>
                      <SelectItem value="Sugerencia">Sugerencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Asunto</Label>
                  <Input placeholder="Resume tu solicitud en una línea" value={asunto} onChange={field(setAsunto)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Descripción</Label>
                  <Textarea placeholder="Describe tu solicitud con detalle..." rows={4} value={descripcion} onChange={field(setDescripcion)} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPqrsOpen(false)}>Cancelar</Button>
                  <Button onClick={handleEnviarPQRS} disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar PQRS'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </Layout>
    </ProtectedRoute>
  );
};
