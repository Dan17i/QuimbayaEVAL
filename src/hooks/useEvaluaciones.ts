import { useState, useEffect, useMemo } from 'react';
import { evaluacionesService, Evaluacion, EstadoEvaluacion, EvaluacionFilters } from '../services/evaluacionesService';
import { toast } from 'sonner';

/**
 * Hook para manejar evaluaciones
 */
export const useEvaluaciones = (filters?: EvaluacionFilters) => {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluacionesService.getAll(filters);
      setEvaluaciones(data);
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
    return evaluaciones.filter(evaluacion => evaluacion.cursoId === cursoId);
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
