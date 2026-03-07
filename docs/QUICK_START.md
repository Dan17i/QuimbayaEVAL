# 🚀 Quick Start - Conexión Backend

## ✅ ¿Qué se ha hecho?

Tu frontend QuimbayaEVAL ahora está completamente conectado con el backend. Se han creado:

1. ✅ Cliente HTTP configurado (Axios)
2. ✅ 7 servicios para todos los módulos
3. ✅ Hooks actualizados (useCursos, useEvaluaciones, usePQRS)
4. ✅ AuthContext integrado con backend real
5. ✅ Manejo automático de errores y tokens
6. ✅ Tipos TypeScript completos

## 🎯 Pasos para Empezar

### 1. Instalar Dependencias (Ya hecho)

```bash
npm install
```

### 2. Iniciar el Backend

```bash
cd backend
mvn spring-boot:run
```

El backend debe estar corriendo en: `http://localhost:8080`

### 3. Iniciar el Frontend

```bash
npm run dev
```

El frontend estará en: `http://localhost:5173`

## 🔑 Credenciales de Prueba

Usa estas credenciales para probar el login (según tu backend):

**Estudiante:**
- Email: `estudiante@universidad.edu`
- Password: `password123`
- Role: `estudiante`

**Maestro:**
- Email: `maestro@universidad.edu`
- Password: `password123`
- Role: `maestro`

## 📝 Cómo Usar en tus Componentes

### Opción 1: Usar Hooks (Recomendado)

```typescript
import { useCursos } from './hooks/useCursos';

function MiComponente() {
  const { cursos, loading, error, refetch } = useCursos();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {cursos.map(curso => (
        <div key={curso.id}>{curso.nombre}</div>
      ))}
    </div>
  );
}
```

### Opción 2: Usar Servicios Directamente

```typescript
import { cursosService } from './services';

async function crearCurso() {
  const curso = await cursosService.create({
    codigo: 'MAT-101',
    nombre: 'Matemáticas',
    descripcion: 'Curso de matemáticas',
    profesorId: 1
  });
}
```

## 📚 Servicios Disponibles

```typescript
import {
  authService,          // Login, registro
  cursosService,        // CRUD de cursos
  evaluacionesService,  // CRUD de evaluaciones
  preguntasService,     // CRUD de preguntas
  submissionsService,   // Entregas de estudiantes
  calificacionesService,// Calificaciones
  pqrsService          // Sistema PQRS
} from './services';
```

## 🔍 Ver Ejemplos Completos

Revisa el archivo `src/examples/EjemploUsoServicios.tsx` para ver ejemplos de:

- ✅ Crear cursos
- ✅ Crear evaluaciones con preguntas
- ✅ Entregar evaluaciones (estudiantes)
- ✅ Calificar evaluaciones (maestros)
- ✅ Crear y responder PQRS
- ✅ Obtener datos relacionados

## 🛠️ Configuración

### Variables de Entorno (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_MOCK_DATA=false
```

### Cambiar URL del Backend

Si tu backend está en otra URL, edita `.env.local`:

```env
VITE_API_BASE_URL=http://tu-servidor:puerto/api
```

## 🔐 Autenticación

El sistema maneja automáticamente:

- ✅ Guardar token en localStorage
- ✅ Agregar token a todas las peticiones
- ✅ Redirigir al login si el token expira
- ✅ Mostrar notificaciones de error

```typescript
import { useAuth } from './contexts/AuthContext';

function Login() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login('email@example.com', 'password', 'estudiante');
      // Login exitoso - redirige automáticamente
    } catch (error) {
      // Error mostrado automáticamente
    }
  };
}
```

## 📊 Estados de Carga

Todos los hooks incluyen estados:

```typescript
const { 
  cursos,    // Datos
  loading,   // true mientras carga
  error,     // mensaje de error si falla
  refetch    // función para recargar
} = useCursos();
```

## 🔄 Recargar Datos

```typescript
const { cursos, refetch } = useCursos();

// Después de crear/editar/eliminar
await cursosService.create(nuevoCurso);
refetch(); // Recarga la lista
```

## ⚠️ Troubleshooting

### Error: "Network Error"

- ✅ Verifica que el backend esté corriendo
- ✅ Verifica la URL en `.env.local`
- ✅ Revisa la consola del navegador

### Error: "CORS"

Verifica que el backend tenga configurado:

```yaml
# application.yml
cors:
  allowed-origins: http://localhost:5173
```

### Error: "401 Unauthorized"

- ✅ El token expiró (redirige automáticamente al login)
- ✅ Credenciales incorrectas

## 📖 Documentación Completa

- `BACKEND_CONNECTION.md` - Guía detallada de integración
- `FRONTEND_INTEGRATION.md` - Documentación completa del API
- `src/examples/EjemploUsoServicios.tsx` - Ejemplos de código

## 🎉 ¡Listo!

Tu aplicación ahora está conectada al backend. Puedes:

1. Hacer login con usuarios reales
2. Crear y gestionar cursos
3. Crear evaluaciones con preguntas
4. Entregar y calificar evaluaciones
5. Gestionar PQRS

¡Empieza a desarrollar! 🚀
