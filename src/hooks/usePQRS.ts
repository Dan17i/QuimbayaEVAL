import { useState, useEffect, useMemo } from 'react';
import { pqrsService, PQRS as PQRSBackend, EstadoPQRS, TipoPQRS } from '../services/pqrsService';
import { cursosService } from '../services/cursosService';
import { TicketPQRS } from '../types';
import { toast } from 'sonner';

/**
 * Hook para manejar tickets PQRS — mapea datos del backend al formato de la UI
 */
export const usePQRS = () => {
  const [tickets, setTickets] = useState<TicketPQRS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPQRS = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rawTickets, cursos] = await Promise.all([
        pqrsService.getMisPQRS(),
        cursosService.getAll(),
      ]);

      const cursoMap = new Map(cursos.map(c => [c.id, `${c.codigo} - ${c.nombre}`]));

      const mapped: TicketPQRS[] = rawTickets.map((t: PQRSBackend) => ({
        id: t.id,
        tipo: t.tipo,
        asunto: t.asunto,
        descripcion: t.descripcion,
        estado: t.estado,
        fechaCreacion: t.fechaCreacion,
        createdAt: t.createdAt,
        curso: t.cursoId ? (cursoMap.get(t.cursoId) ?? 'General') : 'General',
        respuesta: t.respuesta,
      }));

      setTickets(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar PQRS';
      setError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPQRS();
  }, []);

  const ticketsPendientes = useMemo(() => 
    tickets.filter(ticket => ticket.estado === 'Pendiente'),
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

  return {
    tickets,
    ticketsPendientes,
    loading,
    error,
    getByEstado,
    getByTipo,
    getById,
    refetch,
  };
};
