import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Filter, MoreVertical, Edit, Send } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { StatusBadge } from '../components/StatusBadge';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { SearchInput } from '../components/SearchInput';
import { formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EstadoEvaluacion } from '../types';
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const EvaluacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluaciones, loading } = useEvaluaciones();
  const [filterCurso, setFilterCurso] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cursosUnicos = useMemo(() => {
    const set = new Set(evaluaciones.map(e => e.curso));
    return Array.from(set).sort();
  }, [evaluaciones]);

  const evaluacionesFiltradas = useMemo(() => {
    let filtradas = evaluaciones;
    if (filterCurso !== 'all') filtradas = filtradas.filter(e => e.curso === filterCurso);
    if (filterEstado !== 'all') {
      const estado = (filterEstado.charAt(0).toUpperCase() + filterEstado.slice(1)) as EstadoEvaluacion;
      filtradas = filtradas.filter(e => e.estado === estado);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtradas = filtradas.filter(e =>
        e.name.toLowerCase().includes(q) || e.curso.toLowerCase().includes(q)
      );
    }
    return filtradas;
  }, [evaluaciones, filterCurso, filterEstado, searchQuery]);

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Curso</label>
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursosUnicos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Estado</label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => { setFilterCurso('all'); setFilterEstado('all'); }}>
            <Filter className="w-4 h-4" />
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['maestro', 'coordinador']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Evaluaciones' }]} sidebar={sidebar}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Mis Evaluaciones</h2>
              <p className="text-gray-600 mt-2">Gestiona evaluaciones y calificaciones</p>
            </div>
            <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => navigate(ROUTES.CREAR_EVALUACION)}>
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <SearchInput placeholder="Buscar por nombre o curso..." onSearch={setSearchQuery} debounceMs={300} />
              </div>

              {loading ? (
                <LoadingSpinner size="md" text="Cargando evaluaciones..." />
              ) : evaluacionesFiltradas.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No se encontraron evaluaciones"
                  description={searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay evaluaciones con los filtros seleccionados'}
                  actionLabel="Limpiar filtros"
                  onAction={() => { setFilterCurso('all'); setFilterEstado('all'); setSearchQuery(''); }}
                />
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Evaluación</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha límite</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluacionesFiltradas.map((evaluacion) => (
                          <TableRow key={evaluacion.id}>
                            <TableCell className="whitespace-nowrap">{evaluacion.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{evaluacion.curso}</TableCell>
                            <TableCell><Badge variant="info">{evaluacion.tipo}</Badge></TableCell>
                            <TableCell><StatusBadge estado={evaluacion.estado} /></TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(evaluacion.deadline)}</TableCell>
                            <TableCell className="whitespace-nowrap">{evaluacion.duracion ?? '—'}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`${ROUTES.EVALUACIONES}/${evaluacion.id}/editar`)}>
                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  {evaluacion.estado === 'Borrador' && (
                                    <DropdownMenuItem onClick={() => toast.info('Publicar', { description: 'Funcionalidad próximamente' })}>
                                      <Send className="w-4 h-4 mr-2" /> Publicar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && evaluacionesFiltradas.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  Mostrando {evaluacionesFiltradas.length} de {evaluaciones.length} evaluaciones
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
