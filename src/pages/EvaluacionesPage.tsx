import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Filter, MoreVertical, Edit, Copy, Send, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { StatusBadge } from '../components/StatusBadge';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { SearchInput } from '../components/SearchInput';
import { formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EstadoEvaluacion, TipoEvaluacion } from '../types';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';

interface EvaluacionConProgreso {
  id: number;
  nombre: string;
  curso: string;
  tipo: TipoEvaluacion;
  estado: EstadoEvaluacion;
  fecha: string;
  estudiantes: number;
  completados: number;
}

export const EvaluacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluaciones } = useEvaluaciones();
  const [filterCurso, setFilterCurso] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mock de datos adicionales (en el futuro vendrá del backend)
  const evaluacionesConProgreso: EvaluacionConProgreso[] = [
    { id: 1, nombre: 'Parcial 1 - Cálculo Integral', curso: 'MAT-301', tipo: 'Examen', estado: 'Activa', fecha: '2025-10-20', estudiantes: 45, completados: 37 },
    { id: 2, nombre: 'Quiz 3 - Derivadas', curso: 'MAT-301', tipo: 'Quiz', estado: 'Cerrada', fecha: '2025-10-18', estudiantes: 45, completados: 45 },
    { id: 3, nombre: 'Taller Grupal - Integrales', curso: 'MAT-301', tipo: 'Taller', estado: 'Programada', fecha: '2025-10-25', estudiantes: 45, completados: 0 },
    { id: 4, nombre: 'Examen Final - Álgebra Lineal', curso: 'MAT-205', tipo: 'Examen', estado: 'Borrador', fecha: '2025-11-15', estudiantes: 38, completados: 0 },
    { id: 5, nombre: 'Laboratorio 2 - Física', curso: 'FIS-401', tipo: 'Taller', estado: 'Activa', fecha: '2025-10-21', estudiantes: 42, completados: 28 },
  ];

  const evaluacionesFiltradas = useMemo(() => {
    let filtradas = evaluacionesConProgreso;

    // Filtro por curso
    if (filterCurso !== 'all') {
      filtradas = filtradas.filter(e => e.curso === filterCurso);
    }

    // Filtro por estado
    if (filterEstado !== 'all') {
      const estadoNormalizado = filterEstado.charAt(0).toUpperCase() + filterEstado.slice(1) as EstadoEvaluacion;
      filtradas = filtradas.filter(e => e.estado === estadoNormalizado);
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtradas = filtradas.filter(e => 
        e.nombre.toLowerCase().includes(query) || 
        e.curso.toLowerCase().includes(query)
      );
    }

    return filtradas;
  }, [filterCurso, filterEstado, searchQuery]);

  const cursosUnicos = useMemo(() => {
    const cursosSet = new Set(evaluacionesConProgreso.map(e => e.curso));
    return Array.from(cursosSet).sort();
  }, []);

  const handleAccion = (accion: string, evaluacionId: number) => {
    switch (accion) {
      case 'ver':
        toast.info('Ver detalles', { description: `Abriendo evaluación ${evaluacionId}` });
        break;
      case 'editar':
        navigate(`${ROUTES.EVALUACIONES}/${evaluacionId}/editar`);
        break;
      case 'duplicar':
        toast.success('Evaluación duplicada', { description: 'Se ha creado una copia de la evaluación' });
        break;
      case 'publicar':
        toast.success('Evaluación publicada', { description: 'La evaluación está ahora disponible para estudiantes' });
        break;
    }
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Curso</label>
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursosUnicos.map((curso) => (
                  <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                ))}
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
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => {
            setFilterCurso('all');
            setFilterEstado('all');
          }}>
            <Filter className="w-4 h-4" />
            Limpiar Filtros
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">Estados de Evaluación</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Borrador:</strong> En construcción</li>
            <li><strong>Programada:</strong> Publicada con fecha futura</li>
            <li><strong>Activa:</strong> Abierta para estudiantes</li>
            <li><strong>Cerrada:</strong> Completada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Evaluaciones' }]} sidebar={sidebar}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>Mis Evaluaciones</h2>
              <p className="text-gray-600 mt-2">Gestiona evaluaciones, plantillas y calificaciones</p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => navigate(ROUTES.CREAR_EVALUACION)}>
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <SearchInput
                  placeholder="Buscar evaluaciones por nombre o código..."
                  onSearch={setSearchQuery}
                  debounceMs={300}
                />
              </div>

              {evaluacionesFiltradas.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No se encontraron evaluaciones"
                  description={searchQuery ? `No hay resultados para "${searchQuery}"` : 'No hay evaluaciones que coincidan con los filtros seleccionados'}
                  actionLabel="Limpiar filtros"
                  onAction={() => {
                    setFilterCurso('all');
                    setFilterEstado('all');
                    setSearchQuery('');
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evaluación</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluacionesFiltradas.map((evaluacion) => (
                      <TableRow key={evaluacion.id}>
                        <TableCell>
                          <div>
                            <p className="text-gray-900">{evaluacion.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>{evaluacion.curso}</TableCell>
                        <TableCell>
                          <Badge variant="info">{evaluacion.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge estado={evaluacion.estado} />
                        </TableCell>
                        <TableCell>{formatDate(evaluacion.fecha)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600">
                              {evaluacion.completados}/{evaluacion.estudiantes}
                            </span>
                            <div className="w-20 mt-1">
                              <Progress 
                                value={(evaluacion.completados / evaluacion.estudiantes) * 100} 
                                className="h-1.5" 
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAccion('ver', evaluacion.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAccion('editar', evaluacion.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAccion('duplicar', evaluacion.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              {evaluacion.estado === 'Borrador' && (
                                <DropdownMenuItem onClick={() => handleAccion('publicar', evaluacion.id)}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Publicar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {evaluacionesFiltradas.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>Mostrando {evaluacionesFiltradas.length} de {evaluacionesConProgreso.length} evaluaciones</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Anterior</Button>
                <Button variant="outline" size="sm" disabled>Siguiente</Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
