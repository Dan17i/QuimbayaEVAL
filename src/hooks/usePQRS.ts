import { useState, useMemo } from 'react';
import { TicketPQRS, EstadoPQRS, TipoPQRS } from '../types';
import { mockTicketsPQRS } from '../services/mockData';

/**
 * Hook para manejar tickets PQRS
 */
export const usePQRS = () => {
  const [tickets] = useState<TicketPQRS[]>(mockTicketsPQRS);

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

  return {
    tickets,
    ticketsPendientes,
    getByEstado,
    getByTipo,
    getById,
  };
};

