import { useState, useEffect, useMemo } from 'react';
import { evaluacionesService, Evaluacion as EvaluacionBackend, EstadoEvaluacion, EvaluacionFilters } from '../services/evaluacionesService';
import { cursosService } from '../services/cursosService';
import { Evaluacion } from '../types';
import { toast } from 'sonner';

/**
 * Hook para manejar evaluaciones — mapea datos del backend al formato de la UI
 */
export const useEvaluaciones = (filters?: EvaluacionFilters) => {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rawEvals, cursos] = await Promise.all([
        evaluacionesService.getAll(filters),
        cursosService.getAll(),
      ]);

      const cursoMap = new Map(cursos.map(c => [c.id, c.codigo]));

      const mapped: Evaluacion[] = rawEvals.map((e: EvaluacionBackend) => ({
        id: e.id,
        name: e.nombre,
        curso: cursoMap.get(e.cursoId) ?? String(e.cursoId),
        deadline: e.deadline ?? e.createdAt,
        estado: e.estado,
        tipo: e.tipo,
        duracion: e.duracionMinutos ? `${e.duracionMinutos} min` : undefined,
        intentos: e.intentosPermitidos,
      }));

      setEvaluaciones(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar evaluaciones';
      setError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, [JSON.stringify(filters)]);

  const evaluacionesAbiertas = useMemo(() => 
    evaluaciones.filter(e => e.estado === 'Activa'), 
    [evaluaciones]
  );

  const evaluacionesRecientes = useMemo(() => 
    evaluaciones.slice(0, 4), 
    [evaluaciones]
  );

  const getByEstado = (estado: EstadoEvaluacion) => {
    return evaluaciones.filter(e => e.estado === estado);
  };

  const getById = (id: number) => {
    return evaluaciones.find(evaluacion => evaluacion.id === id);
  };

  const getByCurso = (cursoId: number) => {
    return evaluaciones.filter(evaluacion => evaluacion.curso === String(cursoId));
  };

  const refetch = () => {
    fetchEvaluaciones();
  };

  return {
    evaluaciones,
    evaluacionesAbiertas,
    evaluacionesRecientes,
    loading,
    error,
    getByEstado,
    getById,
    getByCurso,
    refetch,
  };
};
