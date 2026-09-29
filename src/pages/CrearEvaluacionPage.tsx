import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Plus, Trash2, Save, Eye, Send, AlertCircle, ArrowUp, ArrowDown,
  Copy, CheckCircle2, Calculator, Layers, HelpCircle, X, Clock, Award,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cursosService, Curso } from '../services/cursosService';
import { evaluacionesService, TipoEvaluacion, EstadoEvaluacion } from '../services/evaluacionesService';
import { preguntasService, TipoPregunta } from '../services/preguntasService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { toast } from 'sonner';

/**
 * Estructura de pregunta en el formulario de la UI
 */
export interface PreguntaFormItem {
  id: number;
  backendId?: number;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: number | string;
  puntaje: number;
  criterios?: string;
}

const TIPOS_EVALUACION: TipoEvaluacion[] = ['Examen', 'Quiz', 'Taller', 'Proyecto', 'Tarea'];

const formatDeadlineToInput = (val: string | null | undefined): string => {
  if (!val) return '';
  return val.slice(0, 16);
};

const formatDeadlineForBackend = (val: string): string | undefined => {
  if (!val) return undefined;
  if (val.length === 16) return `${val}:00`;
  return val;
};

/**
 * Página interactiva para crear y editar evaluaciones con banco de preguntas dinámico,
 * cálculo automático de puntuación y vista previa en tiempo real (HCI & DCU).
 */
export const CrearEvaluacionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const evaluacionId = id ? Number(id) : null;
  const isEditMode = Boolean(evaluacionId);

  const [searchParams] = useSearchParams();
  const preselectedCursoId = searchParams.get('cursoId');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados generales
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Estados del formulario de evaluación
  const [nombre, setNombre] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState<string>(preselectedCursoId ?? '');
  const [tipo, setTipo] = useState<TipoEvaluacion>('Examen');
  const [estado, setEstado] = useState<EstadoEvaluacion>('Borrador');
  const [duracion, setDuracion] = useState<number>(60);
  const [deadline, setDeadline] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [intentos, setIntentos] = useState<number>(1);
  const [publicada, setPublicada] = useState(false);

  // Estados de preguntas
  const [preguntas, setPreguntas] = useState<PreguntaFormItem[]>([
    {
      id: 1,
      tipo: 'seleccion_multiple',
      enunciado: '',
      opciones: ['', '', '', ''],
      respuestaCorrecta: 0,
      puntaje: 1.0,
    },
  ]);
  const [deletedPreguntaIds, setDeletedPreguntaIds] = useState<number[]>([]);

  // ── Carga de datos iniciales ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar cursos del profesor
        let cursosData: Curso[] = [];
        if (user?.id) {
          cursosData = await cursosService.getByProfesor(Number(user.id)).catch(() => []);
        }
        if (cursosData.length === 0) {
          cursosData = await cursosService.getAll().catch(() => []);
        }
        if (isMounted) setCursos(cursosData);

        // Si es modo edición, cargar la evaluación y sus preguntas
        if (isEditMode && evaluacionId) {
          const [ev, pqs] = await Promise.all([
            evaluacionesService.getById(evaluacionId),
            preguntasService.getByEvaluacion(evaluacionId).catch(() => []),
          ]);

          if (isMounted) {
            setNombre(ev.nombre);
            setSelectedCursoId(String(ev.cursoId));
            setTipo(ev.tipo);
            setEstado(ev.estado);
            setDuracion(ev.duracionMinutos || 60);
            setIntentos(ev.intentosPermitidos || 1);
            setDescripcion(ev.descripcion || '');
            setPublicada(ev.publicada || false);
            setDeadline(formatDeadlineToInput(ev.deadline));

            if (pqs.length > 0) {
              const mappedPreguntas: PreguntaFormItem[] = pqs.map(p => {
                let opciones: string[] = ['', '', '', ''];
                let respuestaCorrecta: number | string = 0;

                if (p.tipo === 'seleccion_multiple') {
                  try {
                    opciones = p.opcionesJson ? JSON.parse(p.opcionesJson) : ['', '', '', ''];
                    const ans = p.respuestaCorrectaJson ? JSON.parse(p.respuestaCorrectaJson) : '';
                    const idx = opciones.indexOf(ans);
                    respuestaCorrecta = idx >= 0 ? idx : 0;
                  } catch {
                    opciones = ['', '', '', ''];
                  }
                } else if (p.tipo === 'verdadero_falso') {
                  opciones = ['Verdadero', 'Falso'];
                  try {
                    const ans = p.respuestaCorrectaJson ? JSON.parse(p.respuestaCorrectaJson) : 'Verdadero';
                    respuestaCorrecta = ans === 'Falso' || ans === 1 ? 1 : 0;
                  } catch {
                    respuestaCorrecta = 0;
                  }
                }

                let criterios = '';
                if (p.tipo === 'respuesta_corta' || p.tipo === 'ensayo') {
                  try {
                    criterios = p.respuestaCorrectaJson ? JSON.parse(p.respuestaCorrectaJson) : '';
                  } catch {
                    criterios = p.respuestaCorrectaJson || '';
                  }
                }

                return {
                  id: p.id,
                  backendId: p.id,
                  tipo: p.tipo,
                  enunciado: p.enunciado || '',
                  opciones,
                  respuestaCorrecta,
                  puntaje: Number(p.puntuacion) || 1.0,
                  criterios,
                };
              });
              setPreguntas(mappedPreguntas);
            }
          }
        }
      } catch (err) {
        toast.error('Error', { description: 'No se pudieron cargar los datos de la evaluación' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarDatos();
    return () => { isMounted = false; };
  }, [evaluacionId, isEditMode, user?.id]);

  // ── Cálculo dinámico de puntuación total ─────────────────────────
  const totalPuntos = useMemo(() => {
    return preguntas.reduce((sum, p) => sum + (Number(p.puntaje) || 0), 0);
  }, [preguntas]);

  // ── Acciones sobre preguntas ─────────────────────────────────────
  const addPregunta = (tipoPregunta: TipoPregunta) => {
    let opciones: string[] = [];
    if (tipoPregunta === 'seleccion_multiple') {
      opciones = ['', '', '', ''];
    } else if (tipoPregunta === 'verdadero_falso') {
      opciones = ['Verdadero', 'Falso'];
    }

    const nuevaPregunta: PreguntaFormItem = {
      id: Date.now(),
      tipo: tipoPregunta,
      enunciado: '',
      opciones,
      respuestaCorrecta: 0,
      puntaje: 1.0,
      criterios: '',
    };

    setPreguntas(prev => [...prev, nuevaPregunta]);
    toast.success('Pregunta agregada');
  };

  const removePregunta = (idToRemove: number) => {
    const item = preguntas.find(p => p.id === idToRemove);
    if (item?.backendId) {
      setDeletedPreguntaIds(prev => [...prev, item.backendId!]);
    }
    setPreguntas(prev => prev.filter(p => p.id !== idToRemove));
    toast.info('Pregunta eliminada');
  };

  const duplicatePregunta = (idToDuplicate: number) => {
    const item = preguntas.find(p => p.id === idToDuplicate);
    if (!item) return;
    const clon: PreguntaFormItem = {
      ...item,
      id: Date.now(),
      backendId: undefined,
      enunciado: `${item.enunciado} (Copia)`,
      opciones: [...item.opciones],
    };
    const index = preguntas.findIndex(p => p.id === idToDuplicate);
    const updated = [...preguntas];
    updated.splice(index + 1, 0, clon);
    setPreguntas(updated);
    toast.success('Pregunta duplicada');
  };

  const movePregunta = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= preguntas.length) return;
    const updated = [...preguntas];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setPreguntas(updated);
  };

  const updatePregunta = (idToUpdate: number, patch: Partial<PreguntaFormItem>) => {
    setPreguntas(prev => prev.map(p => (p.id === idToUpdate ? { ...p, ...patch } : p)));
  };

  const updateOpcion = (preguntaId: number, optIndex: number, text: string) => {
    setPreguntas(prev => prev.map(p => {
      if (p.id !== preguntaId) return p;
      const nuevasOpciones = [...p.opciones];
      nuevasOpciones[optIndex] = text;
      return { ...p, opciones: nuevasOpciones };
    }));
  };

  // ── Distribución equitativa de puntos (HCI Feature) ──────────────
  const distribuirPuntaje = (metaTotal: number) => {
    if (preguntas.length === 0) return;
    const base = Number((metaTotal / preguntas.length).toFixed(2));
    const nuevas = preguntas.map(p => ({ ...p, puntaje: base }));
    // Ajustar residuo en la última pregunta para coincidencia exacta
    const suma = base * preguntas.length;
    const diff = Number((metaTotal - suma).toFixed(2));
    if (diff !== 0 && nuevas.length > 0) {
      nuevas[nuevas.length - 1].puntaje = Number((nuevas[nuevas.length - 1].puntaje + diff).toFixed(2));
    }
    setPreguntas(nuevas);
    toast.success(`Puntuación distribuida equitativamente en ${metaTotal} pts`);
  };

  // ── Validación de formulario ─────────────────────────────────────
  const validar = (paraPublicar: boolean): string | null => {
    if (!nombre.trim()) return 'El nombre de la evaluación es obligatorio.';
    if (!selectedCursoId) return 'Debes seleccionar el curso asociado a la evaluación.';

    if (paraPublicar) {
      if (preguntas.length === 0) return 'Debes agregar al menos una pregunta para poder publicar.';
      const vaciaIndex = preguntas.findIndex(p => !p.enunciado.trim());
      if (vaciaIndex !== -1) return `La Pregunta ${vaciaIndex + 1} no tiene enunciado.`;
      const multiIncompleta = preguntas.findIndex(
        p => p.tipo === 'seleccion_multiple' && p.opciones.some(op => !op.trim())
      );
      if (multiIncompleta !== -1) return `Completa todas las opciones de la Pregunta ${multiIncompleta + 1}.`;
      if (totalPuntos <= 0) return 'La evaluación debe tener un puntaje total mayor a 0.';
    }
    return null;
  };

  // ── Guardado y Persistencia ──────────────────────────────────────
  const handleGuardar = async (paraPublicar: boolean) => {
    const errorValidacion = validar(paraPublicar);
    if (errorValidacion) {
      toast.error('Validación requerida', { description: errorValidacion });
      return;
    }

    setSaving(true);
    try {
      const cursoIdNum = Number(selectedCursoId);
      const profIdNum = Number(user?.id) || 1;
      const deadlineFormatted = formatDeadlineForBackend(deadline);

      let currentEvalId = evaluacionId;

      if (isEditMode && evaluacionId) {
        await evaluacionesService.update(evaluacionId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          cursoId: cursoIdNum,
          profesorId: profIdNum,
          tipo,
          duracionMinutos: Number(duracion) || 60,
          intentosPermitidos: Number(intentos) || 1,
          deadline: deadlineFormatted,
          ...(paraPublicar ? { publicada: true, estado: 'Activa' } : {}),
        });
      } else {
        const nueva = await evaluacionesService.create({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          cursoId: cursoIdNum,
          profesorId: profIdNum,
          tipo,
          estado: paraPublicar ? 'Activa' : 'Borrador',
          duracionMinutos: Number(duracion) || 60,
          intentosPermitidos: Number(intentos) || 1,
          publicada: paraPublicar,
          deadline: deadlineFormatted,
        });
        currentEvalId = nueva.id;
      }

      if (!currentEvalId) {
        throw new Error('No se pudo determinar el identificador de la evaluación');
      }

      // Eliminar preguntas descartadas
      if (deletedPreguntaIds.length > 0) {
        await Promise.allSettled(deletedPreguntaIds.map(pid => preguntasService.delete(pid)));
        setDeletedPreguntaIds([]);
      }

      // Guardar / actualizar preguntas en serie
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        let opcionesJson = '[]';
        let respuestaCorrectaJson = '""';

        if (p.tipo === 'seleccion_multiple') {
          opcionesJson = JSON.stringify(p.opciones);
          const correctIdx = typeof p.respuestaCorrecta === 'number' ? p.respuestaCorrecta : 0;
          respuestaCorrectaJson = JSON.stringify(p.opciones[correctIdx] || '');
        } else if (p.tipo === 'verdadero_falso') {
          opcionesJson = JSON.stringify(['Verdadero', 'Falso']);
          const correctVal = p.respuestaCorrecta === 1 || p.respuestaCorrecta === 'Falso' ? 'Falso' : 'Verdadero';
          respuestaCorrectaJson = JSON.stringify(correctVal);
        } else {
          opcionesJson = '[]';
          respuestaCorrectaJson = JSON.stringify(p.criterios || '');
        }

        const payload = {
          evaluacionId: currentEvalId,
          enunciado: p.enunciado.trim(),
          tipo: p.tipo,
          puntuacion: Number(p.puntaje) || 1.0,
          orden: i + 1,
          opcionesJson,
          respuestaCorrectaJson,
        };

        if (p.backendId) {
          await preguntasService.update(p.backendId, payload);
        } else {
          const creada = await preguntasService.create(payload);
          p.backendId = creada.id;
        }
      }

      if (paraPublicar) {
        await evaluacionesService.publicar(currentEvalId);
        toast.success('¡Evaluación publicada exitosamente!');
      } else {
        toast.success(isEditMode ? 'Evaluación actualizada correctamente' : 'Evaluación guardada en borrador');
      }

      // Redirigir de regreso
      if (selectedCursoId) {
        navigate(`/mis-cursos-maestro/${selectedCursoId}`);
      } else {
        navigate(ROUTES.EVALUACIONES);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al guardar';
      toast.error('Error al procesar la evaluación', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Barra Lateral (Índice y Puntuación) ───────────────────────────
  const sidebar = (
    <Card className="sticky top-20">
      <CardContent className="pt-6 space-y-6">
        {/* Resumen de Puntuación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">Puntuación Total</h3>
            <span className="text-xl font-bold text-blue-600">{totalPuntos.toFixed(1)} pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Layers className="w-3.5 h-3.5" />
            <span>{preguntas.length} {preguntas.length === 1 ? 'pregunta' : 'preguntas'}</span>
          </div>

          {/* Herramientas de distribución rápida de puntos (HCI/DCU) */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-gray-400" />
              Distribución rápida
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-1 h-8"
                onClick={() => distribuirPuntaje(5.0)}
                disabled={preguntas.length === 0}
              >
                Sobre 5.0
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-1 h-8"
                onClick={() => distribuirPuntaje(100.0)}
                disabled={preguntas.length === 0}
              >
                Sobre 100
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-1 h-8"
                onClick={() => {
                  setPreguntas(prev => prev.map(p => ({ ...p, puntaje: 1.0 })));
                  toast.success('Puntuación: 1 pt por pregunta');
                }}
                disabled={preguntas.length === 0}
              >
                1 pt c/u
              </Button>
            </div>
          </div>
        </div>

        {/* Índice de Preguntas con navegación rápida */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Navegación de Preguntas
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {preguntas.map((p, index) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  document.getElementById(`pregunta-card-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full text-left p-2 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs"
              >
                <div className="truncate flex-1 mr-2">
                  <span className="font-semibold text-gray-700">#{index + 1}</span>{' '}
                  <span className="text-gray-500 truncate">
                    {p.enunciado.trim() ? p.enunciado.slice(0, 24) + '...' : '(Sin enunciado)'}
                  </span>
                </div>
                <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                  {p.puntaje} pts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones para Agregar Pregunta */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Agregar Pregunta
          </h4>
          <div className="space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => addPregunta('seleccion_multiple')}
            >
              <Plus className="w-3.5 h-3.5 mr-2 text-blue-600" /> Opción Múltiple
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => addPregunta('verdadero_falso')}
            >
              <Plus className="w-3.5 h-3.5 mr-2 text-purple-600" /> Verdadero / Falso
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => addPregunta('respuesta_corta')}
            >
              <Plus className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Respuesta Corta
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => addPregunta('ensayo')}
            >
              <Plus className="w-3.5 h-3.5 mr-2 text-amber-600" /> Pregunta Abierta / Ensayo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['maestro']}>
        <Layout breadcrumbs={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Evaluaciones', href: '/evaluaciones' }, { label: 'Cargando...' }]}>
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Cargando configuración de la evaluación..." />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    ...(preselectedCursoId
      ? [{ label: cursos.find(c => c.id === Number(preselectedCursoId))?.nombre ?? 'Curso', href: `/mis-cursos-maestro/${preselectedCursoId}` }]
      : [{ label: 'Evaluaciones', href: '/evaluaciones' }]
    ),
    { label: isEditMode ? `Editar: ${nombre || 'Evaluación'}` : 'Nueva Evaluación' },
  ];

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout breadcrumbs={breadcrumbs} sidebar={sidebar}>
        <div className="space-y-6">

          {/* Barra superior de encabezado y acciones principales */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Editar Evaluación' : 'Nueva Evaluación'}
                </h1>
                {isEditMode && (
                  <Badge variant={estado === 'Activa' ? 'success' : 'default'}>
                    {estado}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? 'Modifica los parámetros generales y las preguntas de esta evaluación'
                  : 'Configura las fechas, parámetros y diseña el banco de preguntas para tus estudiantes'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-gray-600" />
                <span>Vista Previa</span>
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleGuardar(false)}
                className="flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-blue-600" />
                <span>{saving ? 'Guardando...' : 'Guardar Borrador'}</span>
              </Button>
              <Button
                disabled={saving}
                onClick={() => handleGuardar(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Publicando...' : 'Publicar Ahora'}</span>
              </Button>
            </div>
          </div>

          {/* Información General */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Configuración General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nombre" className="text-xs font-semibold">
                    Nombre de la Evaluación <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Primer Parcial — Programación Orientada a Objetos"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="curso" className="text-xs font-semibold">
                    Curso <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedCursoId} onValueChange={setSelectedCursoId}>
                    <SelectTrigger id="curso">
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.codigo} — {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tipo" className="text-xs font-semibold">Tipo de Evaluación</Label>
                  <Select value={tipo} onValueChange={(val: TipoEvaluacion) => setTipo(val)}>
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EVALUACION.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="duracion" className="text-xs font-semibold">Duración (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min={1}
                    value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-xs font-semibold">Fecha y Hora de Cierre (Deadline)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="intentos" className="text-xs font-semibold">Intentos Permitidos</Label>
                  <Input
                    id="intentos"
                    type="number"
                    min={1}
                    value={intentos}
                    onChange={e => setIntentos(Number(e.target.value))}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="descripcion" className="text-xs font-semibold">Instrucciones para los estudiantes</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Escribe las indicaciones generales antes de iniciar la prueba..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banco de Preguntas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Banco de Preguntas</h2>
                <p className="text-xs text-gray-500">
                  {preguntas.length} {preguntas.length === 1 ? 'pregunta formulada' : 'preguntas formuladas'} · Total: {totalPuntos.toFixed(1)} puntos
                </p>
              </div>
            </div>

            {preguntas.length === 0 ? (
              <Card className="border-dashed border-2 p-8 text-center bg-gray-50/50">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-700">Sin preguntas añadidas</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Agrega preguntas usando el panel lateral o los botones inferiores para configurar la evaluación.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => addPregunta('seleccion_multiple')}>
                    <Plus className="w-4 h-4 mr-1.5" /> Opción Múltiple
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addPregunta('verdadero_falso')}>
                    <Plus className="w-4 h-4 mr-1.5" /> Verdadero / Falso
                  </Button>
                </div>
              </Card>
            ) : (
              preguntas.map((p, index) => (
                <Card key={p.id} id={`pregunta-card-${p.id}`} className="border-gray-200 transition-all hover:border-gray-300">
                  <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 bg-gray-100 text-xs px-2.5 py-1 rounded-full">
                        Pregunta #{index + 1}
                      </span>
                      <Badge variant={p.tipo === 'seleccion_multiple' ? 'info' : p.tipo === 'verdadero_falso' ? 'secondary' : 'default'}>
                        {p.tipo === 'seleccion_multiple' && 'Opción Múltiple'}
                        {p.tipo === 'verdadero_falso' && 'Verdadero / Falso'}
                        {p.tipo === 'respuesta_corta' && 'Respuesta Corta'}
                        {p.tipo === 'ensayo' && 'Pregunta Abierta'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                        title="Mover arriba"
                        disabled={index === 0}
                        onClick={() => movePregunta(index, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                        title="Mover abajo"
                        disabled={index === preguntas.length - 1}
                        onClick={() => movePregunta(index, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                        title="Duplicar pregunta"
                        onClick={() => duplicatePregunta(p.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar pregunta"
                        onClick={() => removePregunta(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Enunciado */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Enunciado de la Pregunta <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        rows={2}
                        value={p.enunciado}
                        onChange={e => updatePregunta(p.id, { enunciado: e.target.value })}
                        placeholder="Escribe el planteamiento de la pregunta..."
                      />
                    </div>

                    {/* Formato según Tipo */}
                    {p.tipo === 'seleccion_multiple' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Opciones de Respuesta</Label>
                          <span className="text-[11px] text-gray-500">Selecciona el círculo de la opción correcta</span>
                        </div>
                        <div className="space-y-2">
                          {p.opciones.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                id={`radio-${p.id}-${optIdx}`}
                                name={`correcta-${p.id}`}
                                checked={p.respuestaCorrecta === optIdx}
                                onChange={() => updatePregunta(p.id, { respuestaCorrecta: optIdx })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <Input
                                value={opt}
                                onChange={e => updateOpcion(p.id, optIdx, e.target.value)}
                                placeholder={`Opción ${optIdx + 1}`}
                                className={p.respuestaCorrecta === optIdx ? 'border-blue-400 bg-blue-50/20' : ''}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.tipo === 'verdadero_falso' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Respuesta Correcta</Label>
                        <div className="flex gap-4">
                          <label
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all flex-1 ${
                              p.respuestaCorrecta === 0 ? 'border-green-500 bg-green-50/50 text-green-900 font-medium' : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`vf-${p.id}`}
                              checked={p.respuestaCorrecta === 0}
                              onChange={() => updatePregunta(p.id, { respuestaCorrecta: 0 })}
                              className="w-4 h-4 text-green-600"
                            />
                            <span>Verdadero</span>
                          </label>
                          <label
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all flex-1 ${
                              p.respuestaCorrecta === 1 ? 'border-red-500 bg-red-50/50 text-red-900 font-medium' : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`vf-${p.id}`}
                              checked={p.respuestaCorrecta === 1}
                              onChange={() => updatePregunta(p.id, { respuestaCorrecta: 1 })}
                              className="w-4 h-4 text-red-600"
                            />
                            <span>Falso</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {(p.tipo === 'respuesta_corta' || p.tipo === 'ensayo') && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Criterios de Calificación / Respuesta Esperada</Label>
                        <Textarea
                          rows={2}
                          value={p.criterios || ''}
                          onChange={e => updatePregunta(p.id, { criterios: e.target.value })}
                          placeholder="Describe qué aspectos o palabras clave debe contener la respuesta para obtener el puntaje completo..."
                        />
                      </div>
                    )}

                    {/* Fila de Puntaje y Tipo */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                      <div className="w-36">
                        <Label className="text-xs font-semibold">Puntaje (pts)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={p.puntaje}
                          onChange={e => updatePregunta(p.id, { puntaje: Number(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-semibold">Cambiar Tipo</Label>
                        <Select
                          value={p.tipo}
                          onValueChange={(nuevoTipo: TipoPregunta) => {
                            let opciones: string[] = [];
                            if (nuevoTipo === 'seleccion_multiple') opciones = ['', '', '', ''];
                            if (nuevoTipo === 'verdadero_falso') opciones = ['Verdadero', 'Falso'];
                            updatePregunta(p.id, { tipo: nuevoTipo, opciones, respuestaCorrecta: 0 });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seleccion_multiple">Opción Múltiple</SelectItem>
                            <SelectItem value="verdadero_falso">Verdadero / Falso</SelectItem>
                            <SelectItem value="respuesta_corta">Respuesta Corta</SelectItem>
                            <SelectItem value="ensayo">Pregunta Abierta / Ensayo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Modal de Vista Previa (HCI Feedback) */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="info">Vista Previa del Estudiante</Badge>
                <span className="text-xs text-gray-500">· Modo de solo lectura</span>
              </div>
              <DialogTitle className="text-xl font-bold mt-2">
                {nombre || 'Título de la Evaluación'}
              </DialogTitle>
              <DialogDescription>
                {descripcion || 'Sin instrucciones adicionales registradas.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-4 py-3 border-y border-gray-100 text-xs text-gray-600 bg-gray-50/50 px-3 rounded-lg">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Duración: <strong>{duracion} minutos</strong>
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Puntaje Total: <strong>{totalPuntos.toFixed(1)} pts</strong>
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Preguntas: <strong>{preguntas.length}</strong>
              </span>
            </div>

            <div className="space-y-6 my-4">
              {preguntas.map((p, idx) => (
                <div key={p.id} className="p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-600">Pregunta {idx + 1}</span>
                    <span className="font-medium text-gray-500">{p.puntaje} pts</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {p.enunciado || '(Sin enunciado especificado)'}
                  </p>

                  {p.tipo === 'seleccion_multiple' && (
                    <div className="space-y-2 pt-1">
                      {p.opciones.map((op, opIdx) => (
                        <div key={opIdx} className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 bg-gray-50/50 text-xs">
                          <input type="radio" disabled name={`prev-${p.id}`} />
                          <span className="text-gray-700">{op || `Opción ${opIdx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.tipo === 'verdadero_falso' && (
                    <div className="flex gap-3 pt-1">
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50/50 text-xs flex-1">
                        <input type="radio" disabled name={`prev-${p.id}`} />
                        <span>Verdadero</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50/50 text-xs flex-1">
                        <input type="radio" disabled name={`prev-${p.id}`} />
                        <span>Falso</span>
                      </div>
                    </div>
                  )}

                  {(p.tipo === 'respuesta_corta' || p.tipo === 'ensayo') && (
                    <div className="pt-1">
                      <Textarea disabled placeholder="El estudiante redactará su respuesta aquí..." rows={2} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cerrar Vista Previa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </Layout>
    </ProtectedRoute>
  );
};
