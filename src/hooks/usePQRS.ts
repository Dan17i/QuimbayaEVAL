import { useState, useEffect, useMemo } from 'react';
import { pqrsService, PQRS, EstadoPQRS, TipoPQRS } from '../services/pqrsService';
import { toast } from 'sonner';

/**
 * Hook para manejar tickets PQRS
 */
export const usePQRS = () => {
  const [tickets, setTickets] = useState<PQRS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPQRS = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pqrsService.getMisPQRS();
      setTickets(data);
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
