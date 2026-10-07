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
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { usePQRS, DetallePQRS } from '../hooks/usePQRS';
import { TicketPQRS } from '../types';
import { useCursos } from '../hooks/useCursos';
import { pqrsService, TipoPQRS, EstadoPQRS } from '../services/pqrsService';
import { 
  Plus, 
  MessageSquare, 
  AlertCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Filter,
  Eye,
  X
} from 'lucide-react';

interface PQRSFormData {
  tipo: TipoPQRS;
  asunto: string;
  descripcion: string;
  cursoId: number;
  destinatario: 'maestro' | 'coordinador';
}

// Componente para la vista del coordinador
const VistaCoordinador: React.FC<{
  detalleTickets: DetallePQRS[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  responderPQRS: (id: number, respuesta: string, estado: EstadoPQRS) => Promise<boolean>;
  cambiarEstado: (id: number, estado: EstadoPQRS) => Promise<boolean>;
  estadisticas: {
    total: number;
    pendientes: number;
    enProceso: number;
    resueltas: number;
  };
}> = ({ detalleTickets, loading, error, refetch, responderPQRS, cambiarEstado, estadisticas }) => {
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');
  const [selectedTicket, setSelectedTicket] = useState<DetallePQRS | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<EstadoPQRS>('En Proceso');
  const [submitting, setSubmitting] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  const ticketsFiltrados = useMemo(() => {
    let filtered = detalleTickets;
    if (tipoFiltro !== 'Todos') {
      filtered = filtered.filter(t => t.tipo === tipoFiltro);
    }
    if (estadoFiltro !== 'Todos') {
      filtered = filtered.filter(t => t.estado === estadoFiltro);
    }
    return filtered;
  }, [detalleTickets, tipoFiltro, estadoFiltro]);

  const handleResponder = async () => {
    if (!selectedTicket || !responseText.trim()) {
      toast.error('Error', { description: 'Ingresa una respuesta' });
      return;
    }

    setSubmitting(true);
    const success = await responderPQRS(selectedTicket.id, responseText, newStatus);
    setSubmitting(false);

    if (success) {
      setShowResponseDialog(false);
      setResponseText('');
      setSelectedTicket(null);
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoPQRS) => {
    await cambiarEstado(id, nuevoEstado);
  };

  const openResponseDialog = (ticket: DetallePQRS) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.respuesta || '');
    setNewStatus(ticket.estado === 'Pendiente' ? 'En Proceso' : ticket.estado);
    setShowResponseDialog(true);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Cargando solicitudes..." />;
  }

  if (error) {
    return (
      <EmptyState 
        icon={AlertCircle} 
        title="Error al cargar solicitudes" 
        description={error}
        actionLabel="Reintentar"
        onAction={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Total PQRS</p>
                <p className="text-2xl sm:text-3xl mt-1">{estadisticas.total}</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl sm:text-3xl mt-1">{estadisticas.pendientes}</p>
              </div>
              <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">En Proceso</p>
                <p className="text-2xl sm:text-3xl mt-1">{estadisticas.enProceso}</p>
              </div>
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Resueltas</p>
                <p className="text-2xl sm:text-3xl mt-1">{estadisticas.resueltas}</p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Tipo de PQRS</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Petición">Petición</SelectItem>
                  <SelectItem value="Queja">Queja</SelectItem>
                  <SelectItem value="Reclamo">Reclamo</SelectItem>
                  <SelectItem value="Sugerencia">Sugerencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Estado</Label>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Resuelta">Resuelta</SelectItem>
                  <SelectItem value="Cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de PQRS */}
      {ticketsFiltrados.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No hay solicitudes"
          description="No se encontraron PQRS con los filtros seleccionados"
        />
      ) : (
        <div className="space-y-4">
          {ticketsFiltrados.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header del Ticket: Título principal */}
                    <CardTitle className="text-slate-900 dark:text-slate-100 text-lg font-bold">
                      {ticket.asunto}
                    </CardTitle>

                    {/* Contenedor Flex independiente para Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={ticket.tipo === 'Queja' ? 'error' : ticket.tipo === 'Reclamo' ? 'warning' : ticket.tipo === 'Sugerencia' ? 'default' : 'info'}>
                        {ticket.tipo}
                      </Badge>
                      <StatusBadge estado={ticket.estado} />
                      {ticket.estadoSLA && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          ticket.estadoSLA === 'VENCIDO' || ticket.estadoSLA === 'ATENDIDO_FUERA_DE_PLAZO'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                            : ticket.estadoSLA === 'PROXIMO_A_VENCER'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {ticket.estadoSLA === 'VENCIDO'
                            ? `SLA Vencido (${ticket.diasTranscurridos}d / 15d)`
                            : ticket.estadoSLA === 'PROXIMO_A_VENCER'
                            ? `Por Vencer (${ticket.diasTranscurridos}d / 15d)`
                            : ticket.estadoSLA === 'ATENDIDO_A_TIEMPO'
                            ? `Resuelto a tiempo (${ticket.diasTranscurridos}d)`
                            : ticket.estadoSLA === 'ATENDIDO_FUERA_DE_PLAZO'
                            ? `Resuelto fuera de plazo (${ticket.diasTranscurridos}d)`
                            : `En plazo (${ticket.diasTranscurridos}d / 15d)`}
                        </span>
                      )}
                    </div>

                    {/* Metadatos del Solicitante con separadores limpios */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 flex-wrap mt-3">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-200">
                        <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        {ticket.usuarioNombre || 'Usuario'}
                      </span>
                      {ticket.usuarioEmail && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>{ticket.usuarioEmail}</span>
                        </>
                      )}
                      {ticket.curso && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.curso}</span>
                        </>
                      )}
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{formatDateTime(ticket.fechaCreacion)}</span>
                      {ticket.respondidoPorNombre && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                            Atendido por: {ticket.respondidoPorNombre}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Caja de Descripción con alto contraste y padding cómodo */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descripción:</h4>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
                    </div>
                  </div>
                  
                  {ticket.respuesta && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Respuesta:</h4>
                      </div>
                      <div className="p-4 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 rounded-lg">
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.respuesta}</p>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción (Pie de tarjeta) con espaciado cómodo sin borde separador */}
                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <button 
                      type="button"
                      className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                      onClick={() => openResponseDialog(ticket)}
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Responder
                    </button>
                    
                    {ticket.estado === 'Pendiente' && (
                      <button 
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        onClick={() => handleCambiarEstado(ticket.id, 'En Proceso')}
                      >
                        <Clock className="w-4 h-4 mr-1.5" />
                        Marcar En Proceso
                      </button>
                    )}
                    
                    {ticket.estado === 'En Proceso' && (
                      <button 
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        onClick={() => handleCambiarEstado(ticket.id, 'Resuelta')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Marcar Resuelta
                      </button>
                    )}
                    
                    {(ticket.estado === 'Resuelta' || ticket.estado === 'En Proceso') && (
                      <button 
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        onClick={() => handleCambiarEstado(ticket.id, 'Cerrada')}
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para responder */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder PQRS</DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <span>Respondiendo a: <strong>{selectedTicket.asunto}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as EstadoPQRS)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Resuelta">Resuelta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Respuesta *</Label>
              <Textarea
                value={responseText}
                placeholder="Escribe tu respuesta al usuario..."
                rows={6}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResponseDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleResponder}
              disabled={submitting || !responseText.trim()}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Enviando...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Respuesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente para la vista de estudiante/maestro
const VistaEstudiante: React.FC<{
  tickets: TicketPQRS[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  categoriaFiltro: string;
  setCategoriaFiltro: (cat: string) => void;
}> = ({
  tickets,
  loading,
  error,
  refetch,
  categoriaFiltro,
  setCategoriaFiltro,
}) => {
  const ticketsActivos = useMemo(() => {
    const filtrados = tickets.filter(t => t.estado !== 'Resuelta');
    if (categoriaFiltro === 'Todos') return filtrados;
    return filtrados.filter(t => t.estado === categoriaFiltro as any);
  }, [tickets, categoriaFiltro]);

  const ticketsResueltos = useMemo(() => 
    tickets.filter(t => t.estado === 'Resuelta'),
    [tickets]
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

  if (loading) {
    return <LoadingSpinner size="lg" text="Cargando solicitudes..." />;
  }

  if (error) {
    return (
      <EmptyState 
        icon={AlertCircle} 
        title="Error al cargar solicitudes" 
        description={error}
        actionLabel="Reintentar"
        onAction={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
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
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-900 dark:text-slate-100 text-lg font-bold">
                          {ticket.asunto}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getTipoBadge(ticket.tipo)}
                          <StatusBadge estado={ticket.estado} />
                          {ticket.estadoSLA && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                              ticket.estadoSLA === 'VENCIDO' || ticket.estadoSLA === 'ATENDIDO_FUERA_DE_PLAZO'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                                : ticket.estadoSLA === 'PROXIMO_A_VENCER'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {ticket.estadoSLA === 'VENCIDO'
                                ? `Plazo Vencido (${ticket.diasTranscurridos}d / 15d)`
                                : ticket.estadoSLA === 'PROXIMO_A_VENCER'
                                ? `Por vencer (${ticket.diasTranscurridos}d / 15d)`
                                : `En plazo (${ticket.diasTranscurridos}d / 15d)`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 flex-wrap mt-3">
                          {ticket.curso && (
                            <>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.curso}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                            </>
                          )}
                          <span>{formatDateTime(ticket.fechaCreacion)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descripción:</h4>
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
                        </div>
                      </div>
                      {ticket.respuesta && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Respuesta del Equipo:</h4>
                          </div>
                          <div className="p-4 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 rounded-lg">
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.respuesta}</p>
                          </div>
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
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-900 dark:text-slate-100 text-lg font-bold">
                          {ticket.asunto}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getTipoBadge(ticket.tipo)}
                          <StatusBadge estado={ticket.estado} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 flex-wrap mt-3">
                          {ticket.curso && (
                            <>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.curso}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                            </>
                          )}
                          <span>{formatDateTime(ticket.fechaCreacion)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descripción:</h4>
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
                        </div>
                      </div>
                      {ticket.respuesta && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Respuesta del Equipo:</h4>
                          </div>
                          <div className="p-4 bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 rounded-lg">
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.respuesta}</p>
                          </div>
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
  );
};

// Página principal de PQRS
export const PQRSPage: React.FC = () => {
  const { user } = useAuth();
  const esCoordinador = user?.role === 'coordinador';
  const puedeCrear = user?.role === 'estudiante' || user?.role === 'maestro';
  
  // Usar el hook con el parámetro esCoordinador
  const { 
    tickets, 
    detalleTickets,
    loading, 
    error, 
    refetch, 
    responderPQRS,
    cambiarEstado,
    estadisticas,
    esCoordinador: isCoordinator 
  } = usePQRS(esCoordinador);
  
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

  const onSubmit = async (data: PQRSFormData) => {
    try {
      setSubmitting(true);

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

      if (!data.destinatario) {
        toast.error('Campo requerido', {
          description: 'Indica a quién va dirigida tu solicitud',
        });
        return;
      }

      if (!data.cursoId) {
        toast.error('Campo requerido', {
          description: 'Selecciona el curso relacionado',
        });
        return;
      }

      await pqrsService.create({
        tipo: data.tipo,
        asunto: data.asunto,
        descripcion: data.descripcion,
        cursoId: data.cursoId,
        destinatario: data.destinatario,
      });

      toast.success('Solicitud enviada', {
        description: 'Tu PQRS ha sido registrada y será revisada pronto',
      });

      reset();
      setDialogOpen(false);
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

  // Loading general
  if (loading || loadingCursos) {
    return (
      <ProtectedRoute>
        <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'PQRS' }]}>
          <LoadingSpinner size="lg" text="Cargando solicitudes..." />
        </Layout>
      </ProtectedRoute>
    );
  }

  const sidebar = esCoordinador ? null : (
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

        <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="text-sm text-orange-900 mb-2 font-semibold">Tipos de PQRS</h4>
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
          {/* Banner naranja — PQRS/Foros (neuropsicología: fomenta comunicación) */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-white text-xl font-bold">PQRS</h2>
              <p className="text-orange-100 text-sm mt-0.5">
                {esCoordinador
                  ? 'Gestión y seguimiento de solicitudes de la comunidad académica'
                  : 'Canal de comunicación con el equipo académico'}
              </p>
            </div>
            
            {/* Solo mostrar botón de crear para estudiantes y maestros */}
            {puedeCrear && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 w-full sm:w-auto bg-white text-orange-700 hover:bg-orange-50 border-2 border-white font-semibold shadow-sm">
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
                      <Label htmlFor="curso-pqrs">Curso Relacionado *</Label>
                      <input type="hidden" {...register('cursoId', { required: 'Selecciona el curso relacionado' })} />
                      <Select onValueChange={(value) => setValue('cursoId', Number(value), { shouldValidate: true })}>
                        <SelectTrigger id="curso-pqrs">
                          <SelectValue placeholder="Selecciona un curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={String(curso.id)}>
                              {curso.codigo} - {curso.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.cursoId && (
                        <p className="text-sm text-red-600" role="alert">{errors.cursoId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>¿A quién va dirigida tu solicitud? *</Label>
                      <input type="hidden" {...register('destinatario', { required: 'Indica a quién va dirigida tu solicitud' })} />
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setValue('destinatario', 'maestro', { shouldValidate: true })}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                            watch('destinatario') === 'maestro'
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">¿Es sobre contenido del curso?</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Será atendida por el maestro del curso</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('destinatario', 'coordinador', { shouldValidate: true })}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                            watch('destinatario') === 'coordinador'
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">¿Es sobre el docente?</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Será atendida por la coordinación</span>
                        </button>
                      </div>
                      {errors.destinatario && (
                        <p className="text-sm text-red-600" role="alert">{errors.destinatario.message}</p>
                      )}
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
            )}
          </div>

          {/* Renderizar vista según el rol */}
          {esCoordinador ? (
            <VistaCoordinador
              detalleTickets={detalleTickets}
              loading={loading}
              error={error}
              refetch={refetch}
              responderPQRS={responderPQRS}
              cambiarEstado={cambiarEstado}
              estadisticas={estadisticas}
            />
          ) : (
            <VistaEstudiante
             tickets={tickets}
             loading={loading}
             error={error}
             refetch={refetch}
             categoriaFiltro={categoriaFiltro}
             setCategoriaFiltro={setCategoriaFiltro}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
