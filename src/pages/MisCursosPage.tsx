import React, { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, FileText, Users, Calendar, ExternalLink } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/Badge';
import { useCursos } from '../hooks/useCursos';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { ROUTES } from '../constants/routes';
import { formatDate } from '../utils/date';
import { Estadistica } from '../types';

interface CursoDetallado {
  id: number;
  codigo: string;
  nombre: string;
  profesor: string;
  creditos: number;
  horario: string;
  progreso: number;
  evaluacionesPendientes: number;
  proximaClase: string | null;
  estado: 'activo' | 'finalizado';
  descripcion: string;
  materiales: number;
  estudiantes: number;
}

export const MisCursosPage: React.FC = () => {
  const { cursos } = useCursos();
  
  // Mock de datos adicionales para cursos (en el futuro vendrá del backend)
  const cursosDetallados: CursoDetallado[] = [
    {
      id: 1,
      codigo: 'MAT-301',
      nombre: 'Cálculo Integral',
      profesor: 'Prof. Juan García',
      creditos: 4,
      horario: 'Lun-Mie 14:00-16:00',
      progreso: 65,
      evaluacionesPendientes: 1,
      proximaClase: '2025-10-20',
      estado: 'activo',
      descripcion: 'Estudio de integrales definidas e indefinidas, aplicaciones al cálculo de áreas y volúmenes.',
      materiales: 5,
      estudiantes: 45,
    },
    {
      id: 2,
      codigo: 'FIS-401',
      nombre: 'Física Cuántica',
      profesor: 'Prof. María Torres',
      creditos: 3,
      horario: 'Mar-Jue 10:00-12:00',
      progreso: 58,
      evaluacionesPendientes: 2,
      proximaClase: '2025-10-21',
      estado: 'activo',
      descripcion: 'Introducción a la mecánica cuántica, principio de incertidumbre y dualidad onda-partícula.',
      materiales: 8,
      estudiantes: 42,
    },
    {
      id: 3,
      codigo: 'PRG-205',
      nombre: 'Estructuras de Datos',
      profesor: 'Prof. Carlos Méndez',
      creditos: 4,
      horario: 'Lun-Vie 08:00-10:00',
      progreso: 72,
      evaluacionesPendientes: 0,
      proximaClase: '2025-10-20',
      estado: 'activo',
      descripcion: 'Algoritmos y estructuras de datos avanzadas: listas, árboles, grafos y tablas hash.',
      materiales: 12,
      estudiantes: 38,
    },
    {
      id: 4,
      codigo: 'ING-102',
      nombre: 'Inglés Técnico II',
      profesor: 'Prof. Ana López',
      creditos: 2,
      horario: 'Mie-Vie 16:00-18:00',
      progreso: 80,
      evaluacionesPendientes: 1,
      proximaClase: '2025-10-22',
      estado: 'activo',
      descripcion: 'Desarrollo de habilidades de comunicación en inglés técnico para ingeniería.',
      materiales: 6,
      estudiantes: 51,
    },
    {
      id: 5,
      codigo: 'QUI-203',
      nombre: 'Química Orgánica',
      profesor: 'Prof. Roberto Silva',
      creditos: 3,
      horario: 'Mar-Jue 14:00-16:00',
      progreso: 45,
      evaluacionesPendientes: 0,
      proximaClase: '2025-10-21',
      estado: 'activo',
      descripcion: 'Estudio de compuestos orgánicos, reacciones químicas y síntesis.',
      materiales: 7,
      estudiantes: 36,
    },
    {
      id: 6,
      codigo: 'MAT-201',
      nombre: 'Álgebra Lineal',
      profesor: 'Prof. Juan García',
      creditos: 4,
      horario: 'Finalizado - 2025-1',
      progreso: 100,
      evaluacionesPendientes: 0,
      proximaClase: null,
      estado: 'finalizado',
      descripcion: 'Matrices, determinantes, espacios vectoriales y transformaciones lineales.',
      materiales: 10,
      estudiantes: 45,
    },
  ];

  const cursosActivos = useMemo(() => 
    cursosDetallados.filter(c => c.estado === 'activo'),
    [cursosDetallados]
  );
  
  const cursosFinalizados = useMemo(() => 
    cursosDetallados.filter(c => c.estado === 'finalizado'),
    [cursosDetallados]
  );

  const estadisticas = useMemo<Estadistica[]>(() => [
    { 
      label: 'Cursos Activos', 
      value: cursosActivos.length.toString(), 
      icon: BookOpen, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Evaluaciones', 
      value: cursosActivos.reduce((acc, c) => acc + c.evaluacionesPendientes, 0).toString(), 
      icon: FileText, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Créditos', 
      value: cursosActivos.reduce((acc, c) => acc + c.creditos, 0).toString(), 
      icon: Users, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      label: 'Progreso', 
      value: `${Math.round(cursosActivos.reduce((acc, c) => acc + c.progreso, 0) / cursosActivos.length || 0)}%`, 
      icon: Calendar, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
  ], [cursosActivos]);

  const getEstadoBadge = (estado: 'activo' | 'finalizado') => {
    return estado === 'activo' ? (
      <Badge variant="success">Activo</Badge>
    ) : (
      <Badge variant="default">Finalizado</Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Mis Cursos' }]}>
        <div className="space-y-6 lg:space-y-8">
          {/* Header */}
          <div>
            <h2>Mis Cursos</h2>
            <p className="text-gray-600 mt-2">Gestiona tus cursos inscritos y explora materiales de aprendizaje</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {estadisticas.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Tabs para cursos activos y finalizados */}
          <Tabs defaultValue="activos" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="activos">
                Activos ({cursosActivos.length})
              </TabsTrigger>
              <TabsTrigger value="finalizados">
                Finalizados ({cursosFinalizados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activos" className="mt-6 space-y-4">
              {cursosActivos.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No tienes cursos activos"
                  description="No estás inscrito en ningún curso en este momento"
                />
              ) : (
                cursosActivos.map((curso) => (
                <Card key={curso.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                          <h3 className="text-gray-900">
                            {curso.codigo} - {curso.nombre}
                          </h3>
                          {getEstadoBadge(curso.estado)}
                        </div>
                        <CardDescription>
                          {curso.profesor} • {curso.creditos} créditos
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="w-full lg:w-auto">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{curso.descripcion}</p>

                      {/* Información del curso */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Horario</p>
                            <p className="text-gray-900">{curso.horario}</p>
                            {curso.proximaClase && (
                              <p className="text-xs text-gray-500 mt-1">
                                Próxima clase: {formatDate(curso.proximaClase)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Materiales</p>
                            <p className="text-gray-900">{curso.materiales} recursos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Estudiantes</p>
                            <p className="text-gray-900">{curso.estudiantes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progreso del curso</span>
                          <span className="text-sm text-blue-600">{curso.progreso}%</span>
                        </div>
                        <Progress value={curso.progreso} className="h-2" />
                      </div>

                      {/* Evaluaciones pendientes */}
                      {curso.evaluacionesPendientes > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <p className="text-sm text-orange-900">
                            Tienes <strong>{curso.evaluacionesPendientes}</strong> evaluación
                            {curso.evaluacionesPendientes > 1 ? 'es' : ''} pendiente
                            {curso.evaluacionesPendientes > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="finalizados" className="mt-6 space-y-4">
              {cursosFinalizados.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No tienes cursos finalizados"
                  description="Aún no has completado ningún curso"
                />
              ) : (
                cursosFinalizados.map((curso) => (
                <Card key={curso.id} className="opacity-90">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                          <h3 className="text-gray-900">
                            {curso.codigo} - {curso.nombre}
                          </h3>
                          {getEstadoBadge(curso.estado)}
                        </div>
                        <CardDescription>
                          {curso.profesor} • {curso.creditos} créditos
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="w-full lg:w-auto">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Historial
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{curso.descripcion}</p>

                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-sm text-green-900">Curso completado exitosamente</span>
                        <Badge variant="success">
                          100%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
