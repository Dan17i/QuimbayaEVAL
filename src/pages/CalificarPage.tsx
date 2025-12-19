import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const CalificarPage: React.FC = () => {
  const [estudianteActual, setEstudianteActual] = useState(0);
  const [preguntaActual, setPreguntaActual] = useState(0);

  const estudiantes = [
    { id: 1, nombre: 'Ana López', estado: 'Pendiente' },
    { id: 2, nombre: 'Carlos Méndez', estado: 'Pendiente' },
    { id: 3, nombre: 'María García', estado: 'Calificado' },
    { id: 4, nombre: 'Juan Pérez', estado: 'Pendiente' },
  ];

  const preguntas = [
    {
      id: 1,
      enunciado: 'Explica el concepto de integral definida y su relación con el área bajo la curva.',
      tipo: 'abierta',
      puntajeMax: 5,
      respuesta: 'La integral definida es un concepto fundamental del cálculo que permite calcular el área bajo una curva en un intervalo determinado. Matemáticamente, si tenemos una función f(x) continua en [a,b], la integral definida ∫[a,b]f(x)dx representa la suma infinita de áreas de rectángulos infinitesimales...',
      rubrica: [
        { criterio: 'Definición correcta', puntaje: 2 },
        { criterio: 'Explicación del concepto de área', puntaje: 2 },
        { criterio: 'Claridad y estructura', puntaje: 1 },
      ],
    },
    {
      id: 2,
      enunciado: 'Calcula la integral: ∫(2x + 3)dx',
      tipo: 'desarrollo',
      puntajeMax: 3,
      respuesta: '∫(2x + 3)dx = x² + 3x + C',
    },
  ];

  const progreso = ((estudianteActual + 1) / estudiantes.length) * 100;

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Estudiantes</h3>
        <div className="space-y-2">
          {estudiantes.map((estudiante, index) => (
            <div
              key={estudiante.id}
              onClick={() => setEstudianteActual(index)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                estudianteActual === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{estudiante.nombre}</span>
                {estudiante.estado === 'Calificado' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{estudiante.estado}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">Progreso General</p>
          <Progress value={progreso} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {estudiantes.filter(e => e.estado === 'Calificado').length} de {estudiantes.length} calificados
          </p>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Atajos de teclado:</strong><br />
            ← → Navegar estudiantes<br />
            ↑ ↓ Navegar preguntas<br />
            Ctrl+S Guardar
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['maestro']}>
      <Layout
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Calificar', href: '/calificar' },
          { label: 'Parcial 1 - Cálculo Integral' },
        ]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>Calificar: Parcial 1 - Cálculo Integral</h2>
              <p className="text-gray-600 mt-2">
                Estudiante: {estudiantes[estudianteActual].nombre}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEstudianteActual(Math.max(0, estudianteActual - 1))}
                disabled={estudianteActual === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setEstudianteActual(Math.min(estudiantes.length - 1, estudianteActual + 1))}
                disabled={estudianteActual === estudiantes.length - 1}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <Tabs value={`pregunta-${preguntaActual}`} onValueChange={(val) => setPreguntaActual(parseInt(val.split('-')[1]))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pregunta-0">Pregunta 1 (5 pts)</TabsTrigger>
              <TabsTrigger value="pregunta-1">Pregunta 2 (3 pts)</TabsTrigger>
            </TabsList>

            <TabsContent value="pregunta-0" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pregunta 1 - Respuesta Abierta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Enunciado:</p>
                      <p className="text-gray-900">{preguntas[0].enunciado}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Respuesta del Estudiante:</p>
                      <div className="p-4 border border-gray-200 rounded-lg bg-white">
                        <p className="text-gray-900">{preguntas[0].respuesta}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-4">Rúbrica de Calificación</h3>
                      <div className="space-y-4">
                        {preguntas[0].rubrica?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <p className="text-gray-900">{item.criterio}</p>
                              <p className="text-sm text-gray-500 mt-1">Máximo: {item.puntaje} puntos</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {[0, 0.5, 1, 1.5, 2].slice(0, item.puntaje * 2 + 1).map((val) => (
                                <button
                                  key={val}
                                  className="px-3 py-2 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-600 transition-colors"
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Comentarios y Retroalimentación</label>
                      <Textarea
                        placeholder="Escribe comentarios constructivos para el estudiante..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">Puntaje Total</p>
                        <p className="text-2xl text-gray-900 mt-1">0 / {preguntas[0].puntajeMax}</p>
                      </div>
                      <Button className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar Calificación
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pregunta-1" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pregunta 2 - Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Enunciado:</p>
                      <p className="text-gray-900">{preguntas[1].enunciado}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Respuesta del Estudiante:</p>
                      <div className="p-4 border border-gray-200 rounded-lg bg-white">
                        <p className="text-gray-900">{preguntas[1].respuesta}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Puntaje</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={preguntas[1].puntajeMax}
                          step="0.5"
                          className="w-24 px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                        <span className="text-gray-600">/ {preguntas[1].puntajeMax}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Comentarios</label>
                      <Textarea
                        placeholder="Retroalimentación para el estudiante..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Progreso
            </Button>
            <Button className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Finalizar y Enviar Resultados
            </Button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
