import { useState, useEffect, useMemo } from 'react';
import { cursosService, Curso } from '../services/cursosService';
import { toast } from 'sonner';

/**
 * Hook para manejar cursos
 */
export const useCursos = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cursosService.getAll();
      setCursos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cursos';
      setError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const cursosActivos = useMemo(() => cursos, [cursos]);

  const getById = (id: number) => {
    return cursos.find(curso => curso.id === id);
  };

  const getByCodigo = (codigo: string) => {
    return cursos.find(curso => curso.codigo === codigo);
  };

  const refetch = () => {
    fetchCursos();
  };

  return {
    cursos,
    cursosActivos,
    loading,
    error,
    getById,
    getByCodigo,
    refetch,
  };
};
