import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, MoreVertical, Edit, Lock, Unlock, Trash2, Shield, Users, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { DataTable, Column } from '../components/DataTable';
import { SearchInput } from '../components/SearchInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { usersService, UserDTO } from '../services/usersService';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Maestro' | 'Estudiante' | 'Coordinador';
  estado: 'Activo' | 'Bloqueado';
  ultimoAcceso: string;
}

const rolMap: Record<string, Usuario['rol']> = {
  maestro: 'Maestro',
  estudiante: 'Estudiante',
  coordinador: 'Coordinador',
};

function dtoToUsuario(u: UserDTO): Usuario {
  return {
    id: u.id,
    nombre: u.name,
    email: u.email,
    rol: rolMap[u.role?.toLowerCase()] ?? 'Estudiante',
    estado: 'Activo',
    ultimoAcceso: new Date().toISOString(),
  };
}

export const UsuariosPage: React.FC = () => {
  const [filterRol, setFilterRol] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState<Usuario['rol'] | ''>('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAll();
      setUsuarios(data.map(dtoToUsuario));
    } catch {
      // manejado por interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleCrearUsuario = async () => {
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoRol || !nuevoPassword.trim()) {
      toast.error('Campos incompletos', { description: 'Por favor completa todos los campos' });
      return;
    }
    setSaving(true);
    try {
      const creado = await authService.register({
        name: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        password: nuevoPassword.trim(),
        role: nuevoRol.toLowerCase(),
      });
      const nuevo: Usuario = {
        id: creado.id,
        nombre: creado.name,
        email: creado.email,
        rol: nuevoRol as Usuario['rol'],
        estado: 'Activo',
        ultimoAcceso: new Date().toISOString(),
      };
      setUsuarios(prev => [...prev, nuevo]);
      setDialogOpen(false);
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoRol('');
      setNuevoPassword('');
      toast.success('Usuario creado', { description: `${nuevo.nombre} ha sido creado exitosamente` });
    } catch {
      // errores manejados por interceptor
    } finally {
      setSaving(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;

    // Filtro por rol
    if (filterRol !== 'all') {
      filtrados = filtrados.filter(u => u.rol.toLowerCase() === filterRol);
    }

    // Filtro por estado
    if (filterEstado !== 'all') {
      filtrados = filtrados.filter(u => u.estado.toLowerCase() === filterEstado);
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtrados = filtrados.filter(u => 
        u.nombre.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }

    return filtrados;
  }, [filterRol, filterEstado, searchQuery]);

  const getEstadoBadge = (estado: 'Activo' | 'Bloqueado') => {
    return estado === 'Activo' ? (
      <Badge variant="success">Activo</Badge>
    ) : (
      <Badge variant="destructive">Bloqueado</Badge>
    );
  };

  const getRolBadge = (rol: Usuario['rol']) => {
    const variants: Record<Usuario['rol'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Maestro': 'default',
      'Estudiante': 'secondary',
      'Coordinador': 'outline',
    };
    return <Badge variant={variants[rol]}>{rol}</Badge>;
  };

  const handleBloquearUsuario = (usuario: Usuario) => {
    setConfirmDialog({
      open: true,
      title: '¿Bloquear usuario?',
      description: `¿Estás seguro de que deseas bloquear a ${usuario.nombre}? No podrá acceder al sistema hasta que sea desbloqueado.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await usersService.updateStatus(usuario.id, 'bloqueado');
          setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: 'Bloqueado' } : u));
          toast.success('Usuario bloqueado', { description: `${usuario.nombre} ha sido bloqueado` });
        } catch { /* interceptor */ }
      },
    });
  };

  const handleDesbloquearUsuario = (usuario: Usuario) => {
    setConfirmDialog({
      open: true,
      title: '¿Desbloquear usuario?',
      description: `¿Estás seguro de que deseas desbloquear a ${usuario.nombre}?`,
      onConfirm: async () => {
        try {
          await usersService.updateStatus(usuario.id, 'activo');
          setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: 'Activo' } : u));
          toast.success('Usuario desbloqueado', { description: `${usuario.nombre} ha sido desbloqueado` });
        } catch { /* interceptor */ }
      },
    });
  };

  const handleEliminarUsuario = (usuario: Usuario) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar usuario?',
      description: `¿Estás seguro de que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await usersService.delete(usuario.id);
          setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
          toast.success('Usuario eliminado', { description: `${usuario.nombre} ha sido eliminado` });
        } catch { /* interceptor */ }
      },
    });
  };

  const columns: Column<Usuario>[] = [
    {
      key: 'nombre',
      header: 'Usuario',
      sortable: true,
      render: (usuario) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm text-blue-600">{usuario.nombre.charAt(0)}</span>
          </div>
          <span className="text-gray-900">{usuario.nombre}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Correo',
      sortable: true,
    },
    {
      key: 'rol',
      header: 'Rol',
      sortable: true,
      render: (usuario) => getRolBadge(usuario.rol),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (usuario) => getEstadoBadge(usuario.estado),
    },
    {
      key: 'ultimoAcceso',
      header: 'Último Acceso',
      sortable: true,
      render: (usuario) => (
        <span className="text-sm text-gray-600">{formatDate(usuario.ultimoAcceso)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (usuario) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Editar Información
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="w-4 h-4 mr-2" />
              Cambiar Rol
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {usuario.estado === 'Activo' ? (
              <DropdownMenuItem onClick={() => handleBloquearUsuario(usuario)}>
                <Lock className="w-4 h-4 mr-2" />
                Bloquear Usuario
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleDesbloquearUsuario(usuario)}>
                <Unlock className="w-4 h-4 mr-2" />
                Desbloquear Usuario
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => handleEliminarUsuario(usuario)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Usuario
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Rol</label>
            <Select value={filterRol} onValueChange={setFilterRol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="maestro">Maestro</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="coordinador">Coordinador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Estado</label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">Roles y Permisos</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Estudiante:</strong> Rendir evaluaciones, ver historial</li>
            <li><strong>Maestro:</strong> Crear y calificar evaluaciones</li>
            <li><strong>Coordinador:</strong> Reportes y gestión de usuarios</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Usuarios' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Gestión de Usuarios</h2>
              <p className="text-gray-600 mt-2">Administra cuentas, roles y permisos del sistema</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Completa la información del usuario y asigna un rol
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-nombre">Nombre Completo</Label>
                    <Input id="nuevo-nombre" placeholder="Ej: Juan Pérez" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-email">Correo Electrónico</Label>
                    <Input id="nuevo-email" type="email" placeholder="juan.perez@universidad.edu" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-rol">Rol</Label>
                    <Select value={nuevoRol} onValueChange={v => setNuevoRol(v as Usuario['rol'])}>
                      <SelectTrigger id="nuevo-rol">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Estudiante">Estudiante</SelectItem>
                        <SelectItem value="Maestro">Maestro</SelectItem>
                        <SelectItem value="Coordinador">Coordinador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password">Contraseña Temporal</Label>
                    <Input id="nuevo-password" type="password" placeholder="Mínimo 8 caracteres" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCrearUsuario} disabled={saving}>
                    {saving ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Lista de Usuarios</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-full sm:w-80">
                    <SearchInput
                      placeholder="Buscar por nombre o correo..."
                      onSearch={setSearchQuery}
                      debounceMs={300}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={cargarUsuarios} title="Recargar lista">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSpinner size="lg" text="Cargando usuarios..." />
              ) : (
                <DataTable
                  data={usuariosFiltrados}
                  columns={columns}
                  keyExtractor={(usuario) => usuario.id}
                  emptyMessage="No se encontraron usuarios"
                  emptyIcon={Users}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm" disabled>Siguiente</Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
        />
      </Layout>
    </ProtectedRoute>
  );
};
