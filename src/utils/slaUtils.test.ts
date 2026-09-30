import { describe, it, expect } from 'vitest';
import { calcularEstadoSLA, calcularMetricasSLA, getSLABadgeInfo } from './slaUtils';
import { PQRSDetalle } from '../services/pqrsService';

describe('slaUtils', () => {
  describe('calcularEstadoSLA', () => {
    it('retorna VENCIDO cuando días > 15 y no está resuelto', () => {
      expect(calcularEstadoSLA(16, false)).toBe('VENCIDO');
      expect(calcularEstadoSLA(30, false)).toBe('VENCIDO');
    });

    it('retorna PROXIMO_A_VENCER cuando faltan 3 días o menos (12 a 15 días) y no está resuelto', () => {
      expect(calcularEstadoSLA(12, false)).toBe('PROXIMO_A_VENCER');
      expect(calcularEstadoSLA(14, false)).toBe('PROXIMO_A_VENCER');
      expect(calcularEstadoSLA(15, false)).toBe('PROXIMO_A_VENCER');
    });

    it('retorna A_TIEMPO cuando días < 12 y no está resuelto', () => {
      expect(calcularEstadoSLA(0, false)).toBe('A_TIEMPO');
      expect(calcularEstadoSLA(5, false)).toBe('A_TIEMPO');
      expect(calcularEstadoSLA(11, false)).toBe('A_TIEMPO');
    });

    it('retorna ATENDIDO_A_TIEMPO cuando está resuelto dentro del plazo (<= 15 días)', () => {
      expect(calcularEstadoSLA(1, true)).toBe('ATENDIDO_A_TIEMPO');
      expect(calcularEstadoSLA(15, true)).toBe('ATENDIDO_A_TIEMPO');
    });

    it('retorna ATENDIDO_FUERA_DE_PLAZO cuando está resuelto pero superó los 15 días', () => {
      expect(calcularEstadoSLA(16, true)).toBe('ATENDIDO_FUERA_DE_PLAZO');
      expect(calcularEstadoSLA(25, true)).toBe('ATENDIDO_FUERA_DE_PLAZO');
    });
  });

  describe('calcularMetricasSLA', () => {
    const mockDetalles: PQRSDetalle[] = [
      {
        id: 1,
        tipo: 'Petición',
        asunto: 'Certificado de notas',
        descripcion: 'Solicito certificado',
        cursoId: 10,
        cursoNombre: 'ADSO',
        cursoCodigo: '2560',
        usuarioId: 1,
        usuarioNombre: 'Carlos Ruiz',
        usuarioEmail: 'carlos@sena.edu.co',
        estado: 'Pendiente',
        destinatario: 'coordinador',
        fechaCreacion: '2026-09-10',
        fechaRespuesta: null,
        respuesta: null,
        respondidoPorId: null,
        respondidoPorNombre: null,
        diasTranscurridos: 20,
        enPlazo: false,
        estadoSLA: 'VENCIDO',
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-09-10T10:00:00Z',
      },
      {
        id: 2,
        tipo: 'Queja',
        asunto: 'Plataforma caída',
        descripcion: 'Problemas de acceso',
        cursoId: 10,
        cursoNombre: 'ADSO',
        cursoCodigo: '2560',
        usuarioId: 2,
        usuarioNombre: 'Ana Gómez',
        usuarioEmail: 'ana@sena.edu.co',
        estado: 'En Proceso',
        destinatario: 'coordinador',
        fechaCreacion: '2026-09-17',
        fechaRespuesta: null,
        respuesta: null,
        respondidoPorId: null,
        respondidoPorNombre: null,
        diasTranscurridos: 13,
        enPlazo: true,
        estadoSLA: 'PROXIMO_A_VENCER',
        createdAt: '2026-09-17T10:00:00Z',
        updatedAt: '2026-09-17T10:00:00Z',
      },
      {
        id: 3,
        tipo: 'Reclamo',
        asunto: 'Revisión nota examen 1',
        descripcion: 'Solicito revisión',
        cursoId: 10,
        cursoNombre: 'ADSO',
        cursoCodigo: '2560',
        usuarioId: 3,
        usuarioNombre: 'Pedro Torres',
        usuarioEmail: 'pedro@sena.edu.co',
        estado: 'Resuelta',
        destinatario: 'maestro',
        fechaCreacion: '2026-09-25',
        fechaRespuesta: '2026-09-28',
        respuesta: 'Aprobado ajuste',
        respondidoPorId: 5,
        respondidoPorNombre: 'Prof. Mario',
        diasTranscurridos: 3,
        enPlazo: true,
        estadoSLA: 'ATENDIDO_A_TIEMPO',
        createdAt: '2026-09-25T10:00:00Z',
        updatedAt: '2026-09-28T10:00:00Z',
      },
      {
        id: 4,
        tipo: 'Sugerencia',
        asunto: 'Mejora en horario',
        descripcion: 'Recomiendo grabar sesiones',
        cursoId: null,
        cursoNombre: null,
        cursoCodigo: null,
        usuarioId: 4,
        usuarioNombre: 'Laura Vega',
        usuarioEmail: 'laura@sena.edu.co',
        estado: 'Pendiente',
        destinatario: null,
        fechaCreacion: '2026-09-28',
        fechaRespuesta: null,
        respuesta: null,
        respondidoPorId: null,
        respondidoPorNombre: null,
        diasTranscurridos: 2,
        enPlazo: true,
        estadoSLA: 'A_TIEMPO',
        createdAt: '2026-09-28T10:00:00Z',
        updatedAt: '2026-09-28T10:00:00Z',
      },
    ];

    it('calcula métricas de forma precisa sobre lista mixta', () => {
      const metricas = calcularMetricasSLA(mockDetalles);

      expect(metricas.total).toBe(4);
      expect(metricas.pendientes).toHaveLength(3); // Pendientes o En Proceso
      expect(metricas.vencidas).toHaveLength(1);
      expect(metricas.proximas).toHaveLength(1);
      expect(metricas.atendidas).toHaveLength(1);
      expect(metricas.atendidasATiempo).toHaveLength(1);
      // Cumplimiento: (4 total - 1 vencida) / 4 = 75%
      expect(metricas.cumplimientoPct).toBe(75);
      // Urgentes: vencidas + próximas = 2
      expect(metricas.urgentes).toHaveLength(2);
      expect(metricas.urgentes.map(u => u.id)).toEqual([1, 2]);
    });

    it('retorna 100% de cumplimiento cuando no hay PQRS registradas', () => {
      const metricas = calcularMetricasSLA([]);
      expect(metricas.total).toBe(0);
      expect(metricas.cumplimientoPct).toBe(100);
      expect(metricas.urgentes).toHaveLength(0);
    });

    it('retorna 100% de cumplimiento cuando todas están a tiempo o resueltas a tiempo', () => {
      const aTiempo: PQRSDetalle[] = [mockDetalles[2], mockDetalles[3]];
      const metricas = calcularMetricasSLA(aTiempo);
      expect(metricas.cumplimientoPct).toBe(100);
      expect(metricas.vencidas).toHaveLength(0);
    });
  });

  describe('getSLABadgeInfo', () => {
    it('provee estilo de alerta urgente para tickets vencidos', () => {
      const info = getSLABadgeInfo('VENCIDO');
      expect(info.urgente).toBe(true);
      expect(info.label).toContain('Vencido');
      expect(info.badgeClass).toContain('text-red-800');
    });

    it('provee estilo preventivo para tickets próximos a vencer', () => {
      const info = getSLABadgeInfo('PROXIMO_A_VENCER');
      expect(info.urgente).toBe(true);
      expect(info.label).toContain('Por vencer');
      expect(info.badgeClass).toContain('text-amber-800');
    });

    it('provee estilo de éxito para atendidos a tiempo', () => {
      const info = getSLABadgeInfo('ATENDIDO_A_TIEMPO');
      expect(info.urgente).toBe(false);
      expect(info.label).toContain('Atendido a tiempo');
      expect(info.badgeClass).toContain('text-emerald-800');
    });

    it('provee estilo neutral cuando está en término', () => {
      const info = getSLABadgeInfo('A_TIEMPO');
      expect(info.urgente).toBe(false);
      expect(info.badgeClass).toContain('text-blue-800');
    });
  });
});
