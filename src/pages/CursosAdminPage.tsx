import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Plus, Trash2, Users, Edit, BookOpen } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { cursosService, Curso } from '../services/cursosService';
import { usersService, UserDTO } from '../services/usersService';
import { toast } from 'sonner';

interface CursoForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  profesorId: string;
}

const FORM_EMPTY: CursoForm = { codigo: '', nombre: '', descripcion: '', profesorId: '' };

export const CursosAdminPage: React.FC = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<UserDTO[]>([]);
  const [estudiantes, setEstudiantes] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal crear/editar
  const [modalCurso, setModalCurso] = useState(false);
  const [editando, setEditando] = useState<Curso | null>(null);
  const [form, setForm] = useState<CursoForm>(FORM_EMPTY);
  const [saving, setSaving] = useState(false);

  // Modal estudiantes
  const [modalEstudiantes, setModalEstudiantes] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null);
  const [estudiantesCurso, setEstudiantesCurso] = useState<UserDTO[]>([]);
  const [loadingEsts, setLoadingEsts] = useState(false);
  const [estudianteAgregar, setEstudianteAgregar] = useState('');

  // Confirm eliminar
  const [confirmEliminar, setConfirmEliminar] = useState<{ open: boolean; curso: Curso | null }>({ open: false, curso: null });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d, e] = await Promise.all([
        cursosService.getAll(),
        usersService.getByRole('maestro'),
        usersService.getByRole('estudiante'),
      ]);
      setCursos(c);
      setDocentes(d);
      setEstudiantes(e);
    } catch {
      // errores manejados por interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Crear / Editar ──────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_EMPTY);
    setModalCurso(true);
  };

  const abrirEditar = (curso: Curso) => {
    setEditando(curso);
    setForm({
      codigo: curso.codigo,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      profesorId: String(curso.profesorId),
    });
    setModalCurso(true);
  };

  const guardarCurso = async () => {
    if (!form.codigo.trim() || !form.nombre.trim() || !form.profesorId) {
      toast.error('Campos requeridos', { description: 'Código, nombre y docente son obligatorios' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        profesorId: Number(form.profesorId),
      };
      if (editando) {
        const actualizado = await cursosService.update(editando.id, payload);
        setCursos(prev => prev.map(c => c.id === actualizado.id ? actualizado : c));
        toast.success('Curso actualizado');
      } else {
        const nuevo = await cursosService.create(payload);
        setCursos(prev => [...prev, nuevo]);
        toast.success('Curso creado');
      }
      setModalCurso(false);
    } catch {
      // manejado por interceptor
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const eliminarCurso = async () => {
    if (!confirmEliminar.curso) return;
    try {
      await cursosService.delete(confirmEliminar.curso.id);
      setCursos(prev => prev.filter(c => c.id !== confirmEliminar.curso!.id));
      toast.success('Curso eliminado');
    } catch {
      // manejado por interceptor
    } finally {
      setConfirmEliminar({ open: false, curso: null });
    }
  };

  // ── Gestión de estudiantes ──────────────────────────────────────────────────
  const abrirEstudiantes = async (curso: Curso) => {
    setCursoSeleccionado(curso);
    setEstudianteAgregar('');
    setModalEstudiantes(true);
    setLoadingEsts(true);
    try {
      const lista = await cursosService.getEstudiantes(curso.id);
      setEstudiantesCurso(lista);
    } catch {
      setEstudiantesCurso([]);
    } finally {
      setLoadingEsts(false);
    }
  };

  const agregarEstudiante = async () => {
    if (!estudianteAgregar || !cursoSeleccionado) return;
    try {
      await cursosService.matricularEstudiante(cursoSeleccionado.id, Number(estudianteAgregar));
      const est = estudiantes.find(e => e.id === Number(estudianteAgregar));
      if (est) setEstudiantesCurso(prev => [...prev, est]);
      setEstudianteAgregar('');
      toast.success('Estudiante matriculado');
    } catch {
      // manejado por interceptor
    }
  };

  const quitarEstudiante = async (estudianteId: number) => {
    if (!cursoSeleccionado) return;
    try {
      await cursosService.desmatricularEstudiante(cursoSeleccionado.id, estudianteId);
      setEstudiantesCurso(prev => prev.filter(e => e.id !== estudianteId));
      toast.success('Estudiante desmatriculado');
    } catch {
      // manejado por interceptor
    }
  };

  const estudiantesDisponibles = estudiantes.filter(
    e => !estudiantesCurso.some(ec => ec.id === e.id)
  );

  const getNombreDocente = (profesorId: number) =>
    docentes.find(d => d.id === profesorId)?.name ?? `ID ${profesorId}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = (field: keyof CursoForm) => (ev: any) =>
    setForm(f => ({ ...f, [field]: ev.target.value }));

  // ── Columnas tabla ──────────────────────────────────────────────────────────
  const columns: Column<Curso>[] = [
    { key: 'codigo', header: 'Código', sortable: true },
    { key: 'nombre', header: 'Nombre', sortable: true },
    {
      key: 'profesorId',
      header: 'Docente',
      render: (c) => <span className="text-sm text-gray-700">{getNombreDocente(c.profesorId)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (curso) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Gestionar estudiantes" onClick={() => abrirEstudiantes(curso)}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Editar curso" onClick={() => abrirEditar(curso)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Eliminar curso" className="text-red-500 hover:text-red-700"
            onClick={() => setConfirmEliminar({ open: true, curso })}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Cursos' }]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Gestión de Cursos</h2>
              <p className="text-gray-600 mt-1">Crea cursos, asigna docentes y matricula estudiantes</p>
            </div>
            <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={abrirCrear}>
              <Plus className="w-4 h-4" /> Nuevo Curso
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Lista de Cursos</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSpinner size="lg" text="Cargando cursos..." />
              ) : (
                <DataTable
                  data={cursos}
                  columns={columns}
                  keyExtractor={(c) => c.id}
                  emptyMessage="No hay cursos registrados"
                  emptyIcon={BookOpen}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Modal Crear / Editar ── */}
        <Dialog open={modalCurso} onOpenChange={setModalCurso}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Curso' : 'Crear Nuevo Curso'}</DialogTitle>
              <DialogDescription>Completa la información del curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="c-codigo">Código</Label>
                <Input id="c-codigo" placeholder="Ej: MAT101" value={form.codigo}
                  onChange={setField('codigo')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-nombre">Nombre</Label>
                <Input id="c-nombre" placeholder="Ej: Matemáticas I" value={form.nombre}
                  onChange={setField('nombre')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-desc">Descripción</Label>
                <Input id="c-desc" placeholder="Descripción opcional" value={form.descripcion}
                  onChange={setField('descripcion')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-docente">Docente</Label>
                <Select value={form.profesorId} onValueChange={v => setForm(f => ({ ...f, profesorId: v }))}>
                  <SelectTrigger id="c-docente">
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalCurso(false)}>Cancelar</Button>
              <Button onClick={guardarCurso} disabled={saving}>
                {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Curso'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Modal Estudiantes ── */}
        <Dialog open={modalEstudiantes} onOpenChange={setModalEstudiantes}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Estudiantes — {cursoSeleccionado?.nombre}</DialogTitle>
              <DialogDescription>Matricula o desmatricula estudiantes del curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Agregar */}
              <div className="flex gap-2">
                <Select value={estudianteAgregar} onValueChange={setEstudianteAgregar}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantesDisponibles.length === 0 ? (
                      <SelectItem value="__none__" disabled>No hay estudiantes disponibles</SelectItem>
                    ) : (
                      estudiantesDisponibles.map(e => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={agregarEstudiante} disabled={!estudianteAgregar}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Lista matriculados */}
              {loadingEsts ? (
                <LoadingSpinner size="sm" text="Cargando..." />
              ) : estudiantesCurso.length === 0 ? (
                <EmptyState icon={Users} title="Sin estudiantes" description="Este curso no tiene estudiantes matriculados." />
              ) : (
                <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto rounded-md border">
                  {estudiantesCurso.map(est => (
                    <li key={est.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{est.name}</p>
                        <p className="text-gray-500 text-xs">{est.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"
                        onClick={() => quitarEstudiante(est.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalEstudiantes(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Confirm Eliminar ── */}
        <ConfirmDialog
          open={confirmEliminar.open}
          onOpenChange={(open) => setConfirmEliminar(prev => ({ ...prev, open }))}
          title="¿Eliminar curso?"
          description={`¿Seguro que deseas eliminar "${confirmEliminar.curso?.nombre}"? Esta acción no se puede deshacer.`}
          variant="destructive"
          onConfirm={eliminarCurso}
        />
      </Layout>
    </ProtectedRoute>
  );
};
