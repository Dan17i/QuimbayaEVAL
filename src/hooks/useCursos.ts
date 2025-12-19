import { useState, useMemo } from 'react';
import { Curso } from '../types';
import { mockCursos } from '../services/mockData';

/**
 * Hook para manejar cursos
 */
export const useCursos = () => {
  const [cursos] = useState<Curso[]>(mockCursos);

  const cursosActivos = useMemo(() => cursos, [cursos]);

  const getById = (id: number) => {
    return cursos.find(curso => curso.id === id);
  };

  const getByCodigo = (codigo: string) => {
    return cursos.find(curso => curso.codigo === codigo);
  };

  return {
    cursos,
    cursosActivos,
    getById,
    getByCodigo,
  };
};

