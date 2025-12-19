import React, { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TrendingUp, TrendingDown, Award, FileText } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { formatDate } from '../utils/date';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';

interface EvaluacionDetalle {
  id: number;
  nombre: string;
  curso: string;
  fecha: string;
  calificacion: number;
  puntajeMax: number;
  intentos: number;
  feedback: string;
  desglose: Array<{
    pregunta: string;
    obtenido: number;
    maximo: number;
    comentario: string;
  }>;
}

export const HistorialPage: React.FC = () => {
  const { getByEstado } = useEvaluaciones();
  
  const estadisticas = useMemo<Estadistica[]>(() => [
    { label: 'Promedio General', value: '4.2', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Evaluaciones Completadas', value: '18', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasa de Aprobación', value: '94%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ], []);

  const evaluacionesDetalle: EvaluacionDetalle[] = [
    {
      id: 1,
      nombre: 'Quiz 3 - Derivadas',
      curso: 'MAT-301',
      fecha: '2025-10-18',
      calificacion: 4.5,
      puntajeMax: 5.0,
      intentos: 1,
      feedback: 'Excelente comprensión de las reglas de derivación. Continúa practicando con funciones compuestas.',
      desglose: [
        { pregunta: 'Pregunta 1', obtenido: 1.0, maximo: 1.0, comentario: 'Perfecto' },
        { pregunta: 'Pregunta 2', obtenido: 1.0, maximo: 1.0, comentario: 'Correcto' },
        { pregunta: 'Pregunta 3', obtenido: 0.5, maximo: 1.0, comentario: 'Falta desarrollo' },
        { pregunta: 'Pregunta 4', obtenido: 1.0, maximo: 1.0, comentario: 'Bien aplicado' },
        { pregunta: 'Pregunta 5', obtenido: 1.0, maximo: 1.0, comentario: 'Excelente' },
      ],
    },
    {
      id: 2,
      nombre: 'Parcial 1 - Álgebra Lineal',
      curso: 'MAT-205',
      fecha: '2025-10-15',
      calificacion: 4.2,
      puntajeMax: 5.0,
      intentos: 1,
      feedback: 'Buen manejo de matrices y determinantes. Reforzar conceptos de espacios vectoriales.',
      desglose: [
        { pregunta: 'Matrices', obtenido: 2.0, maximo: 2.0, comentario: 'Procedimiento correcto' },
        { pregunta: 'Determinantes', obtenido: 1.5, maximo: 2.0, comentario: 'Error menor en cálculo' },
        { pregunta: 'Espacios vectoriales', obtenido: 0.7, maximo: 1.0, comentario: 'Revisar definiciones' },
      ],
    },
  ];

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

        <div className="mt-6">
          <h4 className="text-sm mb-3">Progreso por Curso</h4>
          <div className="space-y-3">
            {[
              { curso: 'MAT-301', promedio: 4.3, progreso: 75 },
              { curso: 'FIS-401', promedio: 4.0, progreso: 60 },
              { curso: 'PRG-205', promedio: 4.5, progreso: 80 },
            ].map((item) => (
              <div key={item.curso}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-900">{item.curso}</span>
                  <span className="text-gray-600">{item.promedio}/5.0</span>
                </div>
                <Progress value={item.progreso} className="h-1.5" />
              </div>
            ))}
          </div>
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
            <p className="text-gray-600 mt-2">Revisa tus calificaciones, feedback y progreso académico</p>
          </div>

          {evaluacionesDetalle.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay historial de evaluaciones"
              description="Aún no has completado ninguna evaluación"
            />
          ) : (
            <div className="space-y-6">
              {evaluacionesDetalle.map((evaluacion) => (
              <Card key={evaluacion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{evaluacion.nombre}</CardTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        {evaluacion.curso} • {formatDate(evaluacion.fecha)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl text-green-600">{evaluacion.calificacion}</p>
                      <p className="text-sm text-gray-600">/ {evaluacion.puntajeMax}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="feedback">
                    <TabsList>
                      <TabsTrigger value="feedback">Feedback del Profesor</TabsTrigger>
                      <TabsTrigger value="desglose">Desglose por Pregunta</TabsTrigger>
                    </TabsList>

                    <TabsContent value="feedback" className="mt-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-900">{evaluacion.feedback}</p>
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">Recursos recomendados:</p>
                          <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                            <li><a href="#" className="hover:underline">Capítulo 4.2 - Reglas de Derivación</a></li>
                            <li><a href="#" className="hover:underline">Ejercicios complementarios - Derivadas</a></li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="desglose" className="mt-4">
                      <div className="space-y-3">
                        {evaluacion.desglose.map((item, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-gray-900">{item.pregunta}</h4>
                              <span className={`text-sm ${item.obtenido === item.maximo ? 'text-green-600' : 'text-orange-600'}`}>
                                {item.obtenido} / {item.maximo}
                              </span>
                            </div>
                            <div className="mb-2">
                              <Progress value={(item.obtenido / item.maximo) * 100} className="h-1.5" />
                            </div>
                            <p className="text-sm text-gray-600">{item.comentario}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Intentos realizados: {evaluacion.intentos}</p>
                    <Button variant="outline" size="sm">
                      Descargar Reporte PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
