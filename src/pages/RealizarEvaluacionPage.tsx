import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Save } from 'lucide-react';

interface Pregunta {
  id: number;
  tipo: 'seleccion-multiple' | 'verdadero-falso' | 'respuesta-corta';
  enunciado: string;
  opciones?: string[];
  respuesta?: string;
}

export const RealizarEvaluacionPage: React.FC = () => {
  const navigate = useNavigate();
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [tiempoRestante, setTiempoRestante] = useState(3600); // 60 minutos en segundos
  const [guardadoAutomatico, setGuardadoAutomatico] = useState(false);
  const [mostrarAlertaSalir, setMostrarAlertaSalir] = useState(false);

  // Mock de evaluación
  const evaluacion = {
    id: 1,
    nombre: 'Parcial 1 - Cálculo Integral',
    curso: 'MAT-301',
    profesor: 'Prof. Juan García',
    duracionMinutos: 60,
    totalPreguntas: 15,
  };

  const preguntas: Pregunta[] = [
    {
      id: 1,
      tipo: 'seleccion-multiple',
      enunciado: 'La integral definida de una función continua f(x) en el intervalo [a,b] representa:',
      opciones: [
        'El área bajo la curva entre x=a y x=b',
        'La derivada de la función',
        'El límite de la función',
        'La pendiente de la recta tangente',
      ],
    },
    {
      id: 2,
      tipo: 'seleccion-multiple',
      enunciado: '¿Cuál es el resultado de ∫x² dx?',
      opciones: [
        'x³/3 + C',
        'x³ + C',
        '2x + C',
        'x²/2 + C',
      ],
    },
    {
      id: 3,
      tipo: 'verdadero-falso',
      enunciado: 'La integral de una constante es igual a cero.',
      opciones: ['Verdadero', 'Falso'],
    },
    {
      id: 4,
      tipo: 'seleccion-multiple',
      enunciado: 'El teorema fundamental del cálculo establece la relación entre:',
      opciones: [
        'Derivadas e integrales',
        'Límites y continuidad',
        'Series y sucesiones',
        'Funciones y ecuaciones',
      ],
    },
    {
      id: 5,
      tipo: 'respuesta-corta',
      enunciado: 'Explica brevemente qué es una integral impropia y da un ejemplo.',
    },
    {
      id: 6,
      tipo: 'seleccion-multiple',
      enunciado: '¿Cuál de las siguientes integrales requiere sustitución trigonométrica?',
      opciones: [
        '∫ 1/√(1-x²) dx',
        '∫ x² dx',
        '∫ e^x dx',
        '∫ 1/x dx',
      ],
    },
    {
      id: 7,
      tipo: 'verdadero-falso',
      enunciado: 'La regla de la cadena se aplica también en integración.',
      opciones: ['Verdadero', 'Falso'],
    },
    {
      id: 8,
      tipo: 'seleccion-multiple',
      enunciado: 'El método de integración por partes se basa en:',
      opciones: [
        'La regla del producto de derivadas',
        'El teorema de Pitágoras',
        'La regla de la cadena',
        'El teorema del valor medio',
      ],
    },
    {
      id: 9,
      tipo: 'respuesta-corta',
      enunciado: 'Calcula la integral definida: ∫[0,2] x² dx (muestra el procedimiento)',
    },
    {
      id: 10,
      tipo: 'seleccion-multiple',
      enunciado: '¿Qué representa la constante de integración C?',
      opciones: [
        'Una familia infinita de soluciones',
        'Un número específico',
        'La derivada de la función',
        'El límite superior de integración',
      ],
    },
    {
      id: 11,
      tipo: 'verdadero-falso',
      enunciado: 'Toda función continua es integrable.',
      opciones: ['Verdadero', 'Falso'],
    },
    {
      id: 12,
      tipo: 'seleccion-multiple',
      enunciado: 'La integral de sen(x) dx es:',
      opciones: [
        '-cos(x) + C',
        'cos(x) + C',
        '-sen(x) + C',
        'tan(x) + C',
      ],
    },
    {
      id: 13,
      tipo: 'respuesta-corta',
      enunciado: 'Describe el método de fracciones parciales y cuándo se utiliza.',
    },
    {
      id: 14,
      tipo: 'seleccion-multiple',
      enunciado: 'El área entre dos curvas f(x) y g(x) en [a,b] se calcula como:',
      opciones: [
        '∫[a,b] |f(x) - g(x)| dx',
        '∫[a,b] f(x) dx + ∫[a,b] g(x) dx',
        '∫[a,b] f(x) · g(x) dx',
        '∫[a,b] f(x)/g(x) dx',
      ],
    },
    {
      id: 15,
      tipo: 'verdadero-falso',
      enunciado: 'La integral definida siempre da un resultado positivo.',
      opciones: ['Verdadero', 'Falso'],
    },
  ];

  // Cronómetro
  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleFinalizarEvaluacion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Guardado automático cada 30 segundos
  useEffect(() => {
    const autoSave = setInterval(() => {
      setGuardadoAutomatico(true);
      setTimeout(() => setGuardadoAutomatico(false), 2000);
    }, 30000);

    return () => clearInterval(autoSave);
  }, []);

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const handleRespuesta = (preguntaId: number, respuesta: string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: respuesta }));
  };

  const handleSiguiente = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const handleAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const handleIrAPregunta = (index: number) => {
    setPreguntaActual(index);
  };

  const handleFinalizarEvaluacion = () => {
    if (confirm('¿Estás seguro de que deseas finalizar y enviar la evaluación?')) {
      // Aquí se enviaría la evaluación al backend
      navigate('/mis-evaluaciones');
    }
  };

  const preguntasRespondidas = Object.keys(respuestas).length;
  const progresoPercentage = (preguntasRespondidas / preguntas.length) * 100;
  const pregunta = preguntas[preguntaActual];

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header fijo con información de la evaluación */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl truncate">{evaluacion.nombre}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{evaluacion.curso} • {evaluacion.profesor}</p>
              </div>
              
              {/* Cronómetro */}
              <div className="flex items-center gap-4">
                {guardadoAutomatico && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Guardado</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${
                  tiempoRestante < 300 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-mono font-semibold text-sm sm:text-base">
                    {formatearTiempo(tiempoRestante)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Progreso: {preguntasRespondidas} de {preguntas.length}
                </span>
                <span className="text-xs sm:text-sm text-blue-600 font-medium">
                  {Math.round(progresoPercentage)}%
                </span>
              </div>
              <Progress value={progresoPercentage} className="h-2" />
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Alerta de tiempo bajo */}
          {tiempoRestante < 300 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                Quedan menos de 5 minutos. Asegúrate de revisar todas tus respuestas.
              </AlertDescription>
            </Alert>
          )}

          {/* Pregunta actual */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600 text-white text-base px-3 py-1">
                    {preguntaActual + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {pregunta.tipo === 'seleccion-multiple' && 'Selección Múltiple'}
                    {pregunta.tipo === 'verdadero-falso' && 'Verdadero/Falso'}
                    {pregunta.tipo === 'respuesta-corta' && 'Respuesta Corta'}
                  </Badge>
                </div>
                {respuestas[pregunta.id] && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base sm:text-lg mb-6">{pregunta.enunciado}</CardTitle>

              {/* Opciones según tipo de pregunta */}
              {(pregunta.tipo === 'seleccion-multiple' || pregunta.tipo === 'verdadero-falso') && (
                <RadioGroup
                  value={respuestas[pregunta.id] || ''}
                  onValueChange={(value) => handleRespuesta(pregunta.id, value)}
                  className="space-y-3"
                >
                  {pregunta.opciones?.map((opcion, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-blue-50 hover:border-blue-300 ${
                        respuestas[pregunta.id] === opcion
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleRespuesta(pregunta.id, opcion)}
                    >
                      <RadioGroupItem value={opcion} id={`opcion-${index}`} />
                      <Label
                        htmlFor={`opcion-${index}`}
                        className="flex-1 cursor-pointer text-sm sm:text-base"
                      >
                        {opcion}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {pregunta.tipo === 'respuesta-corta' && (
                <Textarea
                  value={respuestas[pregunta.id] || ''}
                  onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="min-h-[150px] text-sm sm:text-base"
                />
              )}

              {/* Navegación entre preguntas */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleAnterior}
                  disabled={preguntaActual === 0}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                {preguntaActual === preguntas.length - 1 ? (
                  <Button
                    onClick={handleFinalizarEvaluacion}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar y Enviar
                  </Button>
                ) : (
                  <Button onClick={handleSiguiente} className="w-full sm:w-auto">
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navegación rápida de preguntas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Navegación Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
                {preguntas.map((p, index) => (
                  <button
                    key={p.id}
                    onClick={() => handleIrAPregunta(index)}
                    className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all ${
                      index === preguntaActual
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                        : respuestas[p.id]
                        ? 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                    aria-label={`Ir a pregunta ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span>Respondida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                  <span>Sin responder</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};
