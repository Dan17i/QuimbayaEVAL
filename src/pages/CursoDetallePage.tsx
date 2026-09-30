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
  Users, GraduationCap, BookOpen, ChevronDown, ChevronUp, Mail, UserCheck
} from 'lucide-react';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { cursosService } from '../services/cursosService';
import { pqrsService, TipoPQRS } from '../services/pqrsService';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { usersService, UserDTO } from '../services/usersService';
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

  // Compañeros y Docente del curso
  const [companeros, setCompaneros] = useState<UserDTO[]>([]);
  const [docente, setDocente] = useState<UserDTO | null>(null);
  const [loadingCompaneros, setLoadingCompaneros] = useState(true);
  const [mostrarCompaneros, setMostrarCompaneros] = useState(false);

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

  useEffect(() => {
    if (!cursoId) return;
    cursosService.getEstudiantes(cursoId)
      .then(setCompaneros)
      .catch(() => setCompaneros([]))
      .finally(() => setLoadingCompaneros(false));
  }, [cursoId]);

  useEffect(() => {
    if (!curso?.profesorId) return;
    usersService.getByRole('maestro')
      .then(docentes => {
        const found = docentes.find(d => d.id === curso.profesorId);
        if (found) setDocente(found);
      })
      .catch(() => {});
  }, [curso?.profesorId]);

  const promedioMateria = useMemo(() => {
    if (resultados.length === 0) return null;
    const notas = resultados.map(r => r.notaEscala ?? r.porcentaje / 20);
    return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
  }, [resultados]);

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
    } catch (err: any) {
      // Solo mostrar error si realmente no se creó (no hay id en la respuesta)
      const hasId = err?.response?.data?.id || err?.message?.includes('id=');
      if (!hasId) {
        toast.error('No se pudo enviar la PQRS. Intenta de nuevo.');
      } else {
        // El backend creó la PQRS pero falló la serialización — igual mostramos confirmación
        const idMatch = String(err?.message ?? '').match(/id=(\d+)/);
        const id = idMatch ? Number(idMatch[1]) : Date.now();
        const evalNombre = pqrsEvalId ? (evalsCurso.find(e => e.id === pqrsEvalId)?.name ?? '') : '';
        setConstancia({ radicado: `PQRS-${id}-${new Date().getFullYear()}`, tipo, asunto: asunto.trim(), descripcion: descripcion.trim(), evalNombre });
        toast.success('PQRS enviada correctamente');
      }
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
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {curso!.codigo}
                      </span>
                      {docente && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          Instructor: {docente.name}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{curso!.nombre}</h1>
                    {curso!.descripcion && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{curso!.descripcion}</p>
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

                {/* Micro-cards de estado en el curso */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{evalsAbiertas.length}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">Pendientes</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{resultados.length}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Calificadas</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {promedioMateria ? `${promedioMateria}` : '—'}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Promedio (0-5.0)</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{companeros.length}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Compañeros</p>
                  </div>
                </div>
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

          {/* Compañeros de curso */}
          <section className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Compañeros de Curso
                <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  {companeros.length}
                </span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 gap-1"
                onClick={() => setMostrarCompaneros(!mostrarCompaneros)}
              >
                {mostrarCompaneros ? (
                  <>Ocultar <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Ver lista <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </Button>
            </div>

            {mostrarCompaneros && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                {loadingCompaneros ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : companeros.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">No hay otros aprendices matriculados.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {companeros.map(c => {
                      const ini = c.name.trim().split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
                      return (
                        <div key={c.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {ini}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
