/**
 * EJEMPLO DE USO DE SERVICIOS
 * 
 * Este archivo muestra cómo usar los servicios del backend
 * en tus componentes de React.
 */

import { useState, useEffect } from 'react';
import { 
  cursosService, 
  evaluacionesService, 
  pqrsService,
  preguntasService,
  submissionsService,
  calificacionesService
} from '../services';
import { useCursos } from '../hooks/useCursos';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { usePQRS } from '../hooks/usePQRS';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// EJEMPLO 1: Usar Hooks (Recomendado)
// ============================================

export function EjemploCursosConHook() {
  const { cursos, loading, error, refetch } = useCursos();

  if (loading) return <div>Cargando cursos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Mis Cursos</h2>
      <button onClick={refetch}>Recargar</button>
      {cursos.map(curso => (
        <div key={curso.id}>
          <h3>{curso.nombre}</h3>
          <p>{curso.descripcion}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 2: Usar Servicios Directamente
// ============================================

export function EjemploCrearCurso() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCrearCurso = async () => {
    try {
      setLoading(true);
      const nuevoCurso = await cursosService.create({
        codigo: 'MAT-101',
        nombre: 'Matemáticas Básicas',
        descripcion: 'Curso introductorio de matemáticas',
        profesorId: Number(user?.id) || 1
      });
      console.log('Curso creado:', nuevoCurso);
      alert('Curso creado exitosamente');
    } catch (error) {
      console.error('Error al crear curso:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCrearCurso} disabled={loading}>
      {loading ? 'Creando...' : 'Crear Curso'}
    </button>
  );
}

// ============================================
// EJEMPLO 3: Evaluaciones con Filtros
// ============================================

export function EjemploEvaluacionesFiltradas() {
  const { evaluaciones, loading } = useEvaluaciones({
    estado: 'Activa',
    tipo: 'Quiz',
    page: 0,
    size: 10
  });

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Quizzes Activos</h2>
      {evaluaciones.map(eval => (
        <div key={eval.id}>
          <h3>{eval.nombre}</h3>
          <p>Estado: {eval.estado}</p>
          <p>Tipo: {eval.tipo}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 4: Crear Evaluación Completa
// ============================================

export function EjemploCrearEvaluacion() {
  const { user } = useAuth();
  const [cursoId, setCursoId] = useState(1);

  const handleCrearEvaluacion = async () => {
    try {
      // 1. Crear la evaluación
      const evaluacion = await evaluacionesService.create({
        nombre: 'Parcial 1',
        descripcion: 'Primera evaluación del semestre',
        cursoId: cursoId,
        profesorId: Number(user?.id) || 1,
        tipo: 'Examen',
        estado: 'Borrador',
        duracionMinutos: 60,
        intentosPermitidos: 1,
        publicada: false
      });

      // 2. Agregar preguntas
      await preguntasService.create({
        evaluacionId: evaluacion.id,
        enunciado: '¿Cuál es la capital de Colombia?',
        tipo: 'seleccion_multiple',
        puntuacion: 1.0,
        orden: 1,
        opcionesJson: JSON.stringify([
          { id: 1, texto: 'Bogotá', correcta: true },
          { id: 2, texto: 'Medellín', correcta: false },
          { id: 3, texto: 'Cali', correcta: false }
        ]),
        respuestaCorrectaJson: JSON.stringify({ respuesta: 'Bogotá' })
      });

      alert('Evaluación creada con éxito');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input 
        type="number" 
        value={cursoId} 
        onChange={(e) => setCursoId(Number(e.target.value))}
        placeholder="ID del curso"
      />
      <button onClick={handleCrearEvaluacion}>
        Crear Evaluación
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 5: Entregar Evaluación (Estudiante)
// ============================================

export function EjemploEntregarEvaluacion() {
  const { user } = useAuth();
  const [evaluacionId, setEvaluacionId] = useState(1);

  const handleEntregar = async () => {
    try {
      // Crear submission
      const submission = await submissionsService.create({
        evaluacionId: evaluacionId,
        estudianteId: Number(user?.id) || 1,
        respuestasJson: JSON.stringify({
          pregunta1: { respuesta: 'Bogotá' },
          pregunta2: { respuesta: 'B' }
        }),
        estado: 'Enviada',
        intentoNumero: 1
      });

      alert('Evaluación entregada exitosamente');
      console.log('Submission:', submission);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input 
        type="number" 
        value={evaluacionId} 
        onChange={(e) => setEvaluacionId(Number(e.target.value))}
        placeholder="ID de la evaluación"
      />
      <button onClick={handleEntregar}>
        Entregar Evaluación
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 6: Calificar Evaluación (Maestro)
// ============================================

export function EjemploCalificar() {
  const { user } = useAuth();
  const [submissionId, setSubmissionId] = useState(1);

  const handleCalificar = async () => {
    try {
      const calificacion = await calificacionesService.create({
        submissionId: submissionId,
        puntuacionObtenida: 8.5,
        puntuacionMaxima: 10.0,
        retroalimentacion: 'Buen trabajo, pero revisa la pregunta 3',
        calificadoPorId: Number(user?.id) || 1
      });

      alert('Calificación guardada');
      console.log('Calificación:', calificacion);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input 
        type="number" 
        value={submissionId} 
        onChange={(e) => setSubmissionId(Number(e.target.value))}
        placeholder="ID de la entrega"
      />
      <button onClick={handleCalificar}>
        Calificar
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 7: Sistema PQRS
// ============================================

export function EjemploPQRS() {
  const { tickets, loading, refetch } = usePQRS();
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleCrearPQRS = async () => {
    try {
      await pqrsService.create({
        tipo: 'Queja',
        asunto: asunto,
        descripcion: descripcion,
        cursoId: 1
      });
      alert('PQRS creada exitosamente');
      refetch(); // Recargar lista
      setAsunto('');
      setDescripcion('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Mis PQRS</h2>
      
      {/* Formulario */}
      <div>
        <input 
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto"
        />
        <textarea 
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
        />
        <button onClick={handleCrearPQRS}>Crear PQRS</button>
      </div>

      {/* Lista */}
      <div>
        {tickets.map(ticket => (
          <div key={ticket.id}>
            <h3>{ticket.asunto}</h3>
            <p>Estado: {ticket.estado}</p>
            <p>Tipo: {ticket.tipo}</p>
            {ticket.respuesta && <p>Respuesta: {ticket.respuesta}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 8: Obtener Datos Relacionados
// ============================================

export function EjemploEvaluacionCompleta() {
  const [evaluacionId] = useState(1);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar evaluación
        const evalData = await evaluacionesService.getById(evaluacionId);
        setEvaluacion(evalData);

        // Cargar preguntas
        const preguntasData = await preguntasService.getByEvaluacion(evaluacionId);
        setPreguntas(preguntasData);

        // Cargar entregas
        const submissionsData = await submissionsService.getByEvaluacion(evaluacionId);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    cargarDatos();
  }, [evaluacionId]);

  if (!evaluacion) return <div>Cargando...</div>;

  return (
    <div>
      <h2>{evaluacion.nombre}</h2>
      <p>{evaluacion.descripcion}</p>
      
      <h3>Preguntas ({preguntas.length})</h3>
      {preguntas.map(p => (
        <div key={p.id}>{p.enunciado}</div>
      ))}

      <h3>Entregas ({submissions.length})</h3>
      {submissions.map(s => (
        <div key={s.id}>Estado: {s.estado}</div>
      ))}
    </div>
  );
}
