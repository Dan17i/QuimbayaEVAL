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
import { Plus, MessageSquare } from 'lucide-react';
import { usePQRS } from '../hooks/usePQRS';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import { TipoPQRS } from '../types';

export const PQRSPage: React.FC = () => {
  const { tickets, getByEstado } = usePQRS();
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');

  const ticketsActivos = useMemo(() => {
    const filtrados = tickets.filter(t => t.estado !== 'Resuelto');
    if (categoriaFiltro === 'Todos') return filtrados;
    return filtrados.filter(t => t.estado === categoriaFiltro as any);
  }, [tickets, categoriaFiltro]);

  const ticketsResueltos = useMemo(() => 
    getByEstado('Resuelto'),
    [getByEstado]
  );

  const getTipoBadge = (tipo: TipoPQRS) => {
    const variants: Record<TipoPQRS, 'default' | 'error' | 'warning' | 'info'> = {
      'Pregunta': 'default',
      'Queja': 'error',
      'Reclamo': 'warning',
      'Sugerencia': 'info',
    };
    return <Badge variant={variants[tipo]}>{tipo}</Badge>;
  };

  const handleEnviarSolicitud = () => {
    toast.success('Solicitud enviada', {
      description: 'Tu PQRS ha sido registrada y será revisada pronto',
    });
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Categorías</h3>
        <div className="space-y-2">
          {['Todos', 'Pendiente', 'En Proceso', 'Resuelto'].map((categoria) => (
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
            <li><strong>Pregunta:</strong> Consultas generales</li>
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
          <div className="flex items-center justify-between">
            <div>
              <h2>PQRS - Peticiones, Quejas, Reclamos y Sugerencias</h2>
              <p className="text-gray-600 mt-2">Canal de comunicación con el equipo académico</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
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
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Solicitud</Label>
                    <Select>
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pregunta">Pregunta</SelectItem>
                        <SelectItem value="queja">Queja</SelectItem>
                        <SelectItem value="reclamo">Reclamo</SelectItem>
                        <SelectItem value="sugerencia">Sugerencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="curso-pqrs">Curso Relacionado (opcional)</Label>
                    <Select>
                      <SelectTrigger id="curso-pqrs">
                        <SelectValue placeholder="Selecciona un curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="MAT-301">MAT-301</SelectItem>
                        <SelectItem value="FIS-401">FIS-401</SelectItem>
                        <SelectItem value="PRG-205">PRG-205</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input id="asunto" placeholder="Resume tu solicitud en una línea" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción Detallada</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe tu solicitud con el mayor detalle posible..."
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button onClick={handleEnviarSolicitud}>Enviar Solicitud</Button>
                </DialogFooter>
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
                              {ticket.curso} • {formatDateTime(ticket.fecha)}
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
                              {ticket.curso} • {formatDateTime(ticket.fecha)}
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
