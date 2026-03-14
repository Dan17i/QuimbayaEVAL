import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { usePQRS } from '../hooks/usePQRS';
import { useCursos } from '../hooks/useCursos';
import { pqrsService, TipoPQRS } from '../services/pqrsService';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface PQRSFormData {
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  cursoId?: number;
}

export const PQRSPage: React.FC = () => {
  const { tickets, loading, error, getByEstado, refetch } = usePQRS();
  const { cursos, loading: loadingCursos } = useCursos();
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<PQRSFormData>({
    mode: 'onChange',
  });

  const ticketsActivos = useMemo(() => {
    const filtrados = tickets.filter(t => t.estado !== 'Resuelta');
    if (categoriaFiltro === 'Todos') return filtrados;
    return filtrados.filter(t => t.estado === categoriaFiltro as any);
  }, [tickets, categoriaFiltro]);

  const ticketsResueltos = useMemo(() => 
    getByEstado('Resuelta'),
    [getByEstado]
  );

  const getTipoBadge = (tipo: TipoPQRS) => {
    const variants: Record<TipoPQRS, 'default' | 'error' | 'warning' | 'info'> = {
      'Petición': 'info',
      'Queja': 'error',
      'Reclamo': 'warning',
      'Sugerencia': 'default',
    };
    return <Badge variant={variants[tipo]}>{tipo}</Badge>;
  };

  const onSubmit = async (data: PQRSFormData) => {
    try {
      setSubmitting(true);

      // Validaciones
      if (!data.tipo) {
        toast.error('Campo requerido', {
          description: 'Selecciona el tipo de solicitud',
        });
        return;
      }

      if (!data.asunto.trim()) {
        toast.error('Campo requerido', {
          description: 'Ingresa un asunto para tu solicitud',
        });
        return;
      }

      if (!data.descripcion.trim()) {
        toast.error('Campo requerido', {
          description: 'Describe tu solicitud con detalle',
        });
        return;
      }

      // Crear PQRS
      await pqrsService.create({
        tipo: data.tipo,
        asunto: data.asunto,
        descripcion: data.descripcion,
        cursoId: data.cursoId,
      });

      toast.success('Solicitud enviada', {
        description: 'Tu PQRS ha sido registrada y será revisada pronto',
      });

      // Limpiar formulario y cerrar dialog
      reset();
      setDialogOpen(false);
      
      // Recargar lista de PQRS
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al enviar la solicitud';
      toast.error('Error', {
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de estados de carga
  if (loading || loadingCursos) {
    return (
      <ProtectedRoute>
        <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'PQRS' }]}>
          <LoadingSpinner size="lg" text="Cargando solicitudes..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  // Manejo de errores
  if (error) {
    return (
      <ProtectedRoute>
        <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'PQRS' }]}>
          <EmptyState 
            icon={AlertCircle} 
            title="Error al cargar solicitudes" 
            description={error}
            actionLabel="Reintentar"
            onAction={refetch}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Categorías</h3>
        <div className="space-y-2">
          {['Todos', 'Pendiente', 'En Proceso', 'Resuelta'].map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaFiltro(categoria)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                categoriaFiltro === categoria 
                  ? 'bg-blue-100 text-blue-900 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">PQRS</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Petición:</strong> Consultas generales</li>
            <li><strong>Queja:</strong> Insatisfacción con el servicio</li>
            <li><strong>Reclamo:</strong> Solicitud de corrección</li>
            <li><strong>Sugerencia:</strong> Propuestas de mejora</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'PQRS' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>PQRS - Peticiones, Quejas, Reclamos y Sugerencias</h2>
              <p className="text-gray-600 mt-2">Canal de comunicación con el equipo académico</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud PQRS</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para enviar tu petición, queja, reclamo o sugerencia
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Solicitud *</Label>
                    <input type="hidden" {...register('tipo', { required: 'Selecciona el tipo de solicitud' })} />
                    <Select onValueChange={(value) => { setValue('tipo', value as TipoPQRS, { shouldValidate: true }); }}>
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Petición">Petición</SelectItem>
                        <SelectItem value="Queja">Queja</SelectItem>
                        <SelectItem value="Reclamo">Reclamo</SelectItem>
                        <SelectItem value="Sugerencia">Sugerencia</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo && (
                      <p className="text-sm text-red-600" role="alert">{errors.tipo.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="curso-pqrs">Curso Relacionado (opcional)</Label>
                    <Select onValueChange={(value) => setValue('cursoId', value === 'general' ? undefined : Number(value))}>
                      <SelectTrigger id="curso-pqrs">
                        <SelectValue placeholder="Selecciona un curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        {cursos.map((curso) => (
                          <SelectItem key={curso.id} value={String(curso.id)}>
                            {curso.codigo} - {curso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto *</Label>
                    <Input 
                      id="asunto" 
                      placeholder="Resume tu solicitud en una línea"
                      {...register('asunto', {
                        required: 'El asunto es requerido',
                        minLength: {
                          value: 5,
                          message: 'El asunto debe tener al menos 5 caracteres'
                        }
                      })}
                      aria-invalid={errors.asunto ? 'true' : 'false'}
                    />
                    {errors.asunto && (
                      <p className="text-sm text-red-600" role="alert">{errors.asunto.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción Detallada *</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe tu solicitud con el mayor detalle posible..."
                      rows={6}
                      {...register('descripcion', {
                        required: 'La descripción es requerida',
                        minLength: {
                          value: 20,
                          message: 'La descripción debe tener al menos 20 caracteres'
                        }
                      })}
                      aria-invalid={errors.descripcion ? 'true' : 'false'}
                    />
                    {errors.descripcion && (
                      <p className="text-sm text-red-600" role="alert">{errors.descripcion.message}</p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        reset();
                        setDialogOpen(false);
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          Enviando...
                        </span>
                      ) : (
                        'Enviar Solicitud'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="mis-tickets">
            <TabsList>
              <TabsTrigger value="mis-tickets">Mis Solicitudes</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="mis-tickets" className="mt-6">
              {ticketsActivos.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No hay solicitudes activas"
                  description={`No tienes solicitudes${categoriaFiltro !== 'Todos' ? ` en estado ${categoriaFiltro}` : ' pendientes'}`}
                />
              ) : (
                <div className="space-y-4">
                  {ticketsActivos.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <CardTitle className="text-gray-900">{ticket.asunto}</CardTitle>
                              {getTipoBadge(ticket.tipo)}
                              <StatusBadge estado={ticket.estado} />
                            </div>
                            <p className="text-sm text-gray-600">
                              {ticket.curso} • {formatDateTime(ticket.fechaCreacion)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm text-gray-600 mb-2">Descripción:</h4>
                            <p className="text-gray-900">{ticket.descripcion}</p>
                          </div>
                          {ticket.respuesta && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                <h4 className="text-sm text-blue-900">Respuesta del Equipo:</h4>
                              </div>
                              <p className="text-gray-900">{ticket.respuesta}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial" className="mt-6">
              {ticketsResueltos.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No hay solicitudes resueltas"
                  description="Aún no tienes solicitudes resueltas en tu historial"
                />
              ) : (
                <div className="space-y-4">
                  {ticketsResueltos.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <CardTitle className="text-gray-900">{ticket.asunto}</CardTitle>
                              {getTipoBadge(ticket.tipo)}
                              <StatusBadge estado={ticket.estado} />
                            </div>
                            <p className="text-sm text-gray-600">
                              {ticket.curso} • {formatDateTime(ticket.fechaCreacion)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm text-gray-600 mb-2">Descripción:</h4>
                            <p className="text-gray-900">{ticket.descripcion}</p>
                          </div>
                          {ticket.respuesta && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-green-600" />
                                <h4 className="text-sm text-green-900">Respuesta del Equipo:</h4>
                              </div>
                              <p className="text-gray-900">{ticket.respuesta}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
