import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Trash2, GripVertical, Save, Eye, Send, AlertCircle } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription } from '../components/ui/alert';

export const CrearEvaluacionPage: React.FC = () => {
  const [preguntas, setPreguntas] = useState([
    { id: 1, tipo: 'multiple', enunciado: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, puntaje: 1 },
  ]);

  const addPregunta = (tipo: string) => {
    const nuevaPregunta = {
      id: Date.now(),
      tipo,
      enunciado: '',
      opciones: tipo === 'multiple' ? ['', '', '', ''] : [],
      respuestaCorrecta: 0,
      puntaje: 1,
    };
    setPreguntas([...preguntas, nuevaPregunta]);
  };

  const removePregunta = (id: number) => {
    setPreguntas(preguntas.filter(p => p.id !== id));
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Índice de Preguntas</h3>
        <div className="space-y-2">
          {preguntas.map((pregunta, index) => (
            <div
              key={pregunta.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Pregunta {index + 1}</span>
                </div>
                <span className="text-xs text-gray-500">{pregunta.puntaje} pts</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 capitalize">{pregunta.tipo}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <h4 className="text-sm text-gray-600 mb-3">Agregar Pregunta</h4>
          <Button variant="outline" size="sm" className="w-full" onClick={() => addPregunta('multiple')}>
            Opción Múltiple
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => addPregunta('verdadero-falso')}>
            Verdadero/Falso
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => addPregunta('abierta')}>
            Respuesta Abierta
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Autoguardado:</strong> Los cambios se guardan automáticamente cada 30 segundos.
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
          { label: 'Evaluaciones', href: '/evaluaciones' },
          { label: 'Nueva Evaluación' },
        ]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>Nueva Evaluación</h2>
              <p className="text-gray-600 mt-2">Crea una evaluación desde cero o usa el banco de preguntas</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Vista Previa
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Guardar Borrador
              </Button>
              <Button className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Publicar
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Completa los campos obligatorios antes de publicar: nombre, curso, fecha y al menos una pregunta.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Evaluación *</Label>
                  <Input id="nombre" placeholder="Ej: Parcial 1 - Cálculo Integral" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curso">Curso *</Label>
                  <Select>
                    <SelectTrigger id="curso">
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAT-301">MAT-301 - Cálculo Integral</SelectItem>
                      <SelectItem value="MAT-205">MAT-205 - Álgebra Lineal</SelectItem>
                      <SelectItem value="FIS-301">FIS-301 - Física III</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Evaluación</Label>
                  <Select>
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="examen">Examen</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="taller">Taller</SelectItem>
                      <SelectItem value="laboratorio">Laboratorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (minutos)</Label>
                  <Input id="duracion" type="number" placeholder="120" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio">Fecha de Inicio *</Label>
                  <Input id="fecha-inicio" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-fin">Fecha de Cierre *</Label>
                  <Input id="fecha-fin" type="datetime-local" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="instrucciones">Instrucciones</Label>
                  <Textarea
                    id="instrucciones"
                    placeholder="Instrucciones para los estudiantes..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="intentos">Número de Intentos Permitidos</Label>
                    <p className="text-xs text-gray-500">Deja vacío para intentos ilimitados</p>
                  </div>
                  <Input id="intentos" type="number" className="w-24" placeholder="1" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mostrar-resultados">Mostrar Resultados Inmediatos</Label>
                    <p className="text-xs text-gray-500">Los estudiantes ven su calificación al terminar</p>
                  </div>
                  <Switch id="mostrar-resultados" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {preguntas.map((pregunta, index) => (
                  <div key={pregunta.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-gray-900">Pregunta {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePregunta(pregunta.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Enunciado de la Pregunta</Label>
                        <Textarea
                          placeholder="Escribe el enunciado..."
                          rows={2}
                          className="mt-2"
                        />
                      </div>

                      {pregunta.tipo === 'multiple' && (
                        <div>
                          <Label>Opciones de Respuesta</Label>
                          <div className="space-y-2 mt-2">
                            {pregunta.opciones.map((_, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input type="radio" name={`respuesta-${pregunta.id}`} />
                                <Input placeholder={`Opción ${optIndex + 1}`} />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Marca la opción correcta
                          </p>
                        </div>
                      )}

                      {pregunta.tipo === 'verdadero-falso' && (
                        <div>
                          <Label>Respuesta Correcta</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`respuesta-${pregunta.id}`} />
                              <span>Verdadero</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`respuesta-${pregunta.id}`} />
                              <span>Falso</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {pregunta.tipo === 'abierta' && (
                        <div>
                          <Label>Criterios de Evaluación (Rúbrica)</Label>
                          <Textarea
                            placeholder="Describe los criterios que se usarán para calificar esta pregunta..."
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label>Puntaje</Label>
                          <Input type="number" defaultValue={1} className="w-24 mt-2" />
                        </div>
                        <div className="flex-1">
                          <Label>Categoría</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conocimiento">Conocimiento</SelectItem>
                              <SelectItem value="aplicacion">Aplicación</SelectItem>
                              <SelectItem value="analisis">Análisis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {preguntas.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No hay preguntas aún</p>
                    <p className="text-sm mt-2">Usa el panel lateral para agregar preguntas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
