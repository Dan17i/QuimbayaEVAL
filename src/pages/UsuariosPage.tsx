import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, MoreVertical, Edit, Lock, Unlock, Trash2, Shield, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { DataTable, Column } from '../components/DataTable';
import { SearchInput } from '../components/SearchInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Badge } from '../components/Badge';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Maestro' | 'Estudiante' | 'Coordinador';
  estado: 'Activo' | 'Bloqueado';
  ultimoAcceso: string;
}

export const UsuariosPage: React.FC = () => {
  const [filterRol, setFilterRol] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const usuarios: Usuario[] = [
    { id: 1, nombre: 'Juan García', email: 'juan.garcia@universidad.edu', rol: 'Maestro', estado: 'Activo', ultimoAcceso: '2025-10-16T14:30:00Z' },
    { id: 2, nombre: 'Ana López', email: 'ana.lopez@universidad.edu', rol: 'Estudiante', estado: 'Activo', ultimoAcceso: '2025-10-16T15:45:00Z' },
    { id: 3, nombre: 'Carlos Méndez', email: 'carlos.mendez@universidad.edu', rol: 'Coordinador', estado: 'Activo', ultimoAcceso: '2025-10-16T10:20:00Z' },
    { id: 4, nombre: 'María Torres', email: 'maria.torres@universidad.edu', rol: 'Maestro', estado: 'Activo', ultimoAcceso: '2025-10-15T16:10:00Z' },
    { id: 5, nombre: 'Pedro Ruiz', email: 'pedro.ruiz@universidad.edu', rol: 'Estudiante', estado: 'Bloqueado', ultimoAcceso: '2025-10-10T09:30:00Z' },
  ];

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
      onConfirm: () => {
        toast.success('Usuario bloqueado', { description: `${usuario.nombre} ha sido bloqueado exitosamente` });
      },
    });
  };

  const handleDesbloquearUsuario = (usuario: Usuario) => {
    setConfirmDialog({
      open: true,
      title: '¿Desbloquear usuario?',
      description: `¿Estás seguro de que deseas desbloquear a ${usuario.nombre}?`,
      onConfirm: () => {
        toast.success('Usuario desbloqueado', { description: `${usuario.nombre} ha sido desbloqueado exitosamente` });
      },
    });
  };

  const handleEliminarUsuario = (usuario: Usuario) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar usuario?',
      description: `¿Estás seguro de que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      variant: 'destructive',
      onConfirm: () => {
        toast.success('Usuario eliminado', { description: `${usuario.nombre} ha sido eliminado exitosamente` });
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
          <div className="flex items-center justify-between">
            <div>
              <h2>Gestión de Usuarios</h2>
              <p className="text-gray-600 mt-2">Administra cuentas, roles y permisos del sistema</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
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
                    <Input id="nuevo-nombre" placeholder="Ej: Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-email">Correo Electrónico</Label>
                    <Input id="nuevo-email" type="email" placeholder="juan.perez@universidad.edu" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-rol">Rol</Label>
                    <Select>
                      <SelectTrigger id="nuevo-rol">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="maestro">Maestro</SelectItem>
                        <SelectItem value="coordinador">Coordinador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password">Contraseña Temporal</Label>
                    <Input id="nuevo-password" type="password" placeholder="Mínimo 8 caracteres" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button onClick={() => toast.success('Usuario creado', { description: 'El nuevo usuario ha sido creado exitosamente' })}>
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Lista de Usuarios</CardTitle>
                <div className="w-full sm:w-80">
                  <SearchInput
                    placeholder="Buscar por nombre o correo..."
                    onSearch={setSearchQuery}
                    debounceMs={300}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={usuariosFiltrados}
                columns={columns}
                keyExtractor={(usuario) => usuario.id}
                emptyMessage="No se encontraron usuarios"
                emptyIcon={Users}
              />
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
