import { useState, useEffect } from 'react';
import { usersService, UserDTO } from '../services/usersService';
import { toast } from 'sonner';

export const useDocentes = () => {
  const [docentes, setDocentes] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await usersService.getByRole('maestro');
        setDocentes(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar docentes';
        setError(message);
        toast.error('Error', { description: message });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { docentes, loading, error };
};
