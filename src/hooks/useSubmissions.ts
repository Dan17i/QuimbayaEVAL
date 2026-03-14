import { useState, useEffect, useMemo } from 'react';
import { submissionsService, Submission } from '../services/submissionsService';
import { toast } from 'sonner';

export const useSubmissions = (estudianteId?: number) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = estudianteId
        ? await submissionsService.getByEstudiante(estudianteId)
        : await submissionsService.getAll();
      setSubmissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar submissions';
      setError(message);
      toast.error('Error', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [estudianteId]);

  const completadas = useMemo(() =>
    submissions.filter(s => s.estado === 'Calificada' || s.estado === 'Enviada'),
    [submissions]
  );

  return { submissions, completadas, loading, error, refetch: fetchSubmissions };
};
