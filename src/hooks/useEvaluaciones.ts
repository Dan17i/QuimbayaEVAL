import { useState, useMemo } from 'react';
import { Evaluacion, EstadoEvaluacion } from '../types';
import { mockEvaluaciones, getEvaluacionesByEstado, getEvaluacionesAbiertas, getEvaluacionesRecientes } from '../services/mockData';

/**
 * Hook para manejar evaluaciones
 */
export const useEvaluaciones = () => {
  const [evaluaciones] = useState<Evaluacion[]>(mockEvaluaciones);

  const evaluacionesAbiertas = useMemo(() => getEvaluacionesAbiertas(), []);
  const evaluacionesRecientes = useMemo(() => getEvaluacionesRecientes(), []);

  const getByEstado = (estado: EstadoEvaluacion) => {
    return getEvaluacionesByEstado(estado);
  };

  const getById = (id: number) => {
    return evaluaciones.find(evaluacion => evaluacion.id === id);
  };

  const getByCurso = (curso: string) => {
    return evaluaciones.filter(evaluacion => evaluacion.curso === curso);
  };

  return {
    evaluaciones,
    evaluacionesAbiertas,
    evaluacionesRecientes,
    getByEstado,
    getById,
    getByCurso,
  };
};

