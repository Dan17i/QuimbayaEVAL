import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Cliente axios configurado
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quimbayaeval_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; message: string }>) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('quimbayaeval_token');
      localStorage.removeItem('quimbayaeval_user');
      window.location.href = '/login';
      toast.error('Sesión expirada', {
        description: 'Por favor, inicia sesión nuevamente',
      });
    } else if (error.response?.data?.message) {
      toast.error('Error', {
        description: error.response.data.message,
      });
    } else if (error.message === 'Network Error') {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
