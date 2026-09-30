import { useState, useEffect, useMemo, useCallback } from 'react';
import { pqrsService, PQRS as PQRSBackend, EstadoPQRS, TipoPQRS } from '../services/pqrsService';
import { cursosService } from '../services/cursosService';
import { usersService, UserDTO } from '../services/usersService';
import { TicketPQRS } from '../types';
import { toast } from 'sonner';

export interface DetallePQRS extends TicketPQRS {
  usuarioNombre?: string;
  usuarioEmail?: string;
}

/**
 * Hook para manejar tickets PQRS — mapea datos del backend al formato de la UI
 * @param esCoordinador - Si es true, trae todas las PQRS de la comunidad
 */
export const usePQRS = (esCoordinador: boolean = false) => {
  const [tickets, setTickets] = useState<TicketPQRS[]>([]);
  const [detalleTickets, setDetalleTickets] = useState<DetallePQRS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPQRS = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar cargar detalles enriquecidos con SLA del backend
      let rawDetalles: any[] = [];
      try {
        rawDetalles = await pqrsService.getDetalles();
      } catch {
        // Fallback para usuarios con permisos restringidos
        rawDetalles = await pqrsService.getAll();
      }

      const mappedDetalle: DetallePQRS[] = rawDetalles.map(t => ({
        id: t.id,
        tipo: t.tipo,
        asunto: t.asunto,
        descripcion: t.descripcion,
        estado: t.estado,
        fechaCreacion: t.fechaCreacion,
        createdAt: t.createdAt,
        curso: t.cursoNombre ? `${t.cursoCodigo ? t.cursoCodigo + ' - ' : ''}${t.cursoNombre}` : (t.curso || 'General'),
        respuesta: t.respuesta,
        usuarioNombre: t.usuarioNombre || 'Usuario',
        usuarioEmail: t.usuarioEmail || '',
        respondidoPorNombre: t.respondidoPorNombre || undefined,
        diasTranscurridos: t.diasTranscurridos,
        enPlazo: t.enPlazo,
        estadoSLA: t.estadoSLA,
      }));

      setTickets(mappedDetalle);
      setDetalleTickets(mappedDetalle);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar PQRS';
      setError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  }, [esCoordinador]);

  useEffect(() => {
    fetchPQRS();
  }, [fetchPQRS]);

  const ticketsPendientes = useMemo(() => 
    tickets.filter(ticket => ticket.estado === 'Pendiente'),
    [tickets]
  );

  const ticketsEnProceso = useMemo(() => 
    tickets.filter(ticket => ticket.estado === 'En Proceso'),
    [tickets]
  );

  const ticketsResueltos = useMemo(() => 
    tickets.filter(ticket => ticket.estado === 'Resuelta'),
    [tickets]
  );

  const getByEstado = (estado: EstadoPQRS) => {
    return tickets.filter(ticket => ticket.estado === estado);
  };

  const getByTipo = (tipo: TipoPQRS) => {
    return tickets.filter(ticket => ticket.tipo === tipo);
  };

  const getById = (id: number) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const refetch = () => {
    fetchPQRS();
  };

  // Función para que el coordinador responda a una PQRS
  const responderPQRS = async (id: number, respuesta: string, nuevoEstado: EstadoPQRS = 'En Proceso') => {
    try {
      await pqrsService.responder(id, { respuesta, estado: nuevoEstado });
      toast.success('Respuesta enviada', { 
        description: 'La PQRS ha sido actualizada correctamente' 
      });
      refetch();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar la respuesta';
      toast.error('Error', { description: message });
      return false;
    }
  };

  // Función para que el coordinador cambie el estado de una PQRS
  const cambiarEstado = async (id: number, estado: EstadoPQRS) => {
    try {
      await pqrsService.cambiarEstado(id, estado);
      toast.success('Estado actualizado', { 
        description: `La PQRS ahora está en estado: ${estado}` 
      });
      refetch();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar el estado';
      toast.error('Error', { description: message });
      return false;
    }
  };

  // Función para marcar como resuelta directamente
  const resolverPQRS = async (id: number, respuesta: string) => {
    return responderPQRS(id, respuesta, 'Resuelta');
  };

  // Obtener estadísticas para el coordinador
  const estadisticas = useMemo(() => ({
    total: tickets.length,
    pendientes: ticketsPendientes.length,
    enProceso: ticketsEnProceso.length,
    resueltas: ticketsResueltos.length,
  }), [tickets, ticketsPendientes, ticketsEnProceso, ticketsResueltos]);

  return {
    tickets,
    detalleTickets,
    ticketsPendientes,
    loading,
    error,
    getByEstado,
    getByTipo,
    getById,
    refetch,
    // Funciones para coordinador
    responderPQRS,
    cambiarEstado,
    resolverPQRS,
    // Estadísticas
    estadisticas,
    esCoordinador,
  };
};
