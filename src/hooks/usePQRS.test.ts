import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePQRS } from './usePQRS';
import { pqrsService } from '../services/pqrsService';
import { toast } from 'sonner';

vi.mock('../services/pqrsService', () => ({
  pqrsService: {
    getDetalles: vi.fn(),
    getAll: vi.fn(),
    responder: vi.fn(),
    cambiarEstado: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePQRS Hook', () => {
  const mockTickets = [
    {
      id: 1,
      tipo: 'Petición',
      asunto: 'Certificado de notas',
      descripcion: 'Solicito certificado',
      estado: 'Pendiente',
      fechaCreacion: '2026-09-10',
      createdAt: '2026-09-10T10:00:00Z',
      cursoId: 10,
      cursoNombre: 'ADSO',
      cursoCodigo: '2560',
      usuarioNombre: 'Carlos Ruiz',
      usuarioEmail: 'carlos@sena.edu.co',
      diasTranscurridos: 18,
      enPlazo: false,
      estadoSLA: 'VENCIDO',
    },
    {
      id: 2,
      tipo: 'Reclamo',
      asunto: 'Revisión examen',
      descripcion: 'Duda en pregunta 3',
      estado: 'En Proceso',
      fechaCreacion: '2026-09-20',
      createdAt: '2026-09-20T10:00:00Z',
      cursoId: 10,
      cursoNombre: 'ADSO',
      usuarioNombre: 'Ana Gómez',
      usuarioEmail: 'ana@sena.edu.co',
      diasTranscurridos: 8,
      enPlazo: true,
      estadoSLA: 'A_TIEMPO',
    },
    {
      id: 3,
      tipo: 'Queja',
      asunto: 'Horario',
      descripcion: 'Cruce con otra clase',
      estado: 'Resuelta',
      fechaCreacion: '2026-09-01',
      createdAt: '2026-09-01T10:00:00Z',
      cursoId: null,
      usuarioNombre: 'Pedro Torres',
      usuarioEmail: 'pedro@sena.edu.co',
      diasTranscurridos: 2,
      enPlazo: true,
      estadoSLA: 'ATENDIDO_A_TIEMPO',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga y mapea los tickets y detalles exitosamente', async () => {
    vi.mocked(pqrsService.getDetalles).mockResolvedValue(mockTickets as any);

    const { result } = renderHook(() => usePQRS());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toHaveLength(3);
    expect(result.current.detalleTickets).toHaveLength(3);
    expect(result.current.tickets[0].curso).toBe('2560 - ADSO');
    expect(result.current.tickets[2].curso).toBe('General');
  });

  it('clasifica tickets en pendientes, en proceso y resueltos, calculando estadísticas', async () => {
    vi.mocked(pqrsService.getDetalles).mockResolvedValue(mockTickets as any);

    const { result } = renderHook(() => usePQRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ticketsPendientes).toHaveLength(1);
    expect(result.current.ticketsPendientes[0].id).toBe(1);

    expect(result.current.estadisticas).toEqual({
      total: 3,
      pendientes: 1,
      enProceso: 1,
      resueltas: 1,
    });
  });

  it('filtra tickets mediante getByEstado, getByTipo y getById', async () => {
    vi.mocked(pqrsService.getDetalles).mockResolvedValue(mockTickets as any);

    const { result } = renderHook(() => usePQRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const pendientes = result.current.getByEstado('Pendiente');
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].asunto).toBe('Certificado de notas');

    const quejas = result.current.getByTipo('Queja');
    expect(quejas).toHaveLength(1);
    expect(quejas[0].id).toBe(3);

    const ticket2 = result.current.getById(2);
    expect(ticket2?.asunto).toBe('Revisión examen');
  });

  it('permite al coordinador responder una PQRS y notifica el éxito', async () => {
    vi.mocked(pqrsService.getDetalles).mockResolvedValue(mockTickets as any);
    vi.mocked(pqrsService.responder).mockResolvedValue({ id: 1 } as any);

    const { result } = renderHook(() => usePQRS(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.responderPQRS(1, 'Se emitió el certificado satisfactoriamente.');
    });

    expect(ok).toBe(true);
    expect(pqrsService.responder).toHaveBeenCalledWith(1, {
      respuesta: 'Se emitió el certificado satisfactoriamente.',
      estado: 'En Proceso',
    });
    expect(toast.success).toHaveBeenCalledWith('Respuesta enviada', expect.any(Object));
  });

  it('permite cambiar de estado una PQRS y resolverla', async () => {
    vi.mocked(pqrsService.getDetalles).mockResolvedValue(mockTickets as any);
    vi.mocked(pqrsService.cambiarEstado).mockResolvedValue({ id: 2 } as any);

    const { result } = renderHook(() => usePQRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.cambiarEstado(2, 'Resuelta');
    });

    expect(ok).toBe(true);
    expect(pqrsService.cambiarEstado).toHaveBeenCalledWith(2, 'Resuelta');
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado', expect.any(Object));
  });

  it('usa fallback a getAll() cuando getDetalles() falla por restricciones de rol', async () => {
    vi.mocked(pqrsService.getDetalles).mockRejectedValue(new Error('Forbidden'));
    vi.mocked(pqrsService.getAll).mockResolvedValue([mockTickets[0]] as any);

    const { result } = renderHook(() => usePQRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toHaveLength(1);
    expect(pqrsService.getAll).toHaveBeenCalled();
  });
});
