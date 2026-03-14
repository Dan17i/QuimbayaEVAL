import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Award, FileText, TrendingUp } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { resultadosService, ResultadoDetalle } from '../services/resultadosService';
import { formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { toast } from 'sonner';

export const HistorialPage: React.FC = () => {
  const { user } = useAuth();
  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        // getMisResultados usa el token del usuario autenticado en el backend
        const raw = await resultadosService.getMisResultados();
        // El backend devuelve Resultado básico; si tiene detalle usamos getByCurso
        // Por ahora mapeamos lo que tenemos
        setResultados(raw as unknown as ResultadoDetalle[]);
      } catch {
        toast.error('Error', { description: 'No se pudo cargar el historial' });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const estadisticas = useMemo<Estadistica[]>(() => {
    if (resultados.length === 0) return [
      { label: 'Promedio General', value: '—', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Evaluaciones Completadas', value: '0', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Tasa de Aprobación', value: '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
    const promedio = resultados.reduce((acc, r) => acc + (r.notaEscala ?? r.porcentaje / 20), 0) / resultados.length;
    const aprobados = resultados.filter(r => (r.notaEscala ?? 0) >= 3).length;
    return [
      { label: 'Promedio General', value: promedio.toFixed(1), icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Evaluaciones Completadas', value: String(resultados.length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Tasa de Aprobación', value: `${Math.round((aprobados / resultados.length) * 100)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  }, [resultados]);

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Estadísticas</h3>
        <div className="space-y-4">
          {estadisticas.map((stat) => (
            <div key={stat.label} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Historial' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div>
            <h2>Historial de Calificaciones</h2>
            <p className="text-gray-600 mt-2">Revisa tus calificaciones y progreso académico</p>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando historial..." />
          ) : resultados.length === 0 ? (
            <EmptyState icon={FileText} title="No hay historial" description="Aún no has completado ninguna evaluación" />
          ) : (
            <div className="space-y-4">
              {resultados.map((r) => {
                const nota = r.notaEscala ?? (r.porcentaje / 20);
                const aprobado = nota >= 3;
                return (
                  <Card key={r.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{r.evaluacionNombre ?? `Evaluación #${r.submissionId}`}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {r.cursoNombre ?? '—'} • {formatDate(r.createdAt)}
                          </p>
                          {r.profesorNombre && (
                            <p className="text-xs text-gray-500 mt-0.5">Docente: {r.profesorNombre}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl ${aprobado ? 'text-green-600' : 'text-red-500'}`}>
                            {nota.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-500">/ 5.0</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Puntaje: {r.puntuacionTotal} / {r.puntuacionMaxima}</span>
                          <span>{r.porcentaje?.toFixed(1)}%</span>
                        </div>
                        <Progress value={r.porcentaje ?? 0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
