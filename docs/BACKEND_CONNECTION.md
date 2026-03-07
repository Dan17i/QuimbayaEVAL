# Conexión con Backend - QuimbayaEVAL

## ✅ Integración Completada

El frontend ahora está completamente integrado con el backend de QuimbayaEVAL.

## 📁 Estructura de Servicios

```
src/services/
├── api.ts                      # Cliente Axios configurado
├── authService.ts              # Autenticación (login/register)
├── cursosService.ts            # Gestión de cursos
├── evaluacionesService.ts      # Gestión de evaluaciones
├── preguntasService.ts         # Gestión de preguntas
├── submissionsService.ts       # Entregas de evaluaciones
├── calificacionesService.ts    # Calificaciones
├── pqrsService.ts              # Sistema PQRS
└── index.ts                    # Exportaciones centralizadas
```

## 🔧 Configuración

### 1. Variables de Entorno

El archivo `.env.local` ya está configurado:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000
VITE_ENABLE_MOCK_DATA=false
```

### 2. Iniciar el Backend

Asegúrate de que el backend esté corriendo en el puerto 8080:

```bash
cd backend
mvn spring-boot:run
```

### 3. Iniciar el Frontend

```bash
npm run dev
```

## 🚀 Uso de los Servicios

### Autenticación

El `AuthContext` ya está actualizado para usar el backend real:

```typescript
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login('usuario@example.com', 'password', 'estudiante');
      // Login exitoso
    } catch (error) {
      // Manejar error
    }
  };
}
```

### Hooks Personalizados

Los hooks ya están actualizados para consumir el backend:

```typescript
// Cursos
import { useCursos } from './hooks/useCursos';
const { cursos, loading, error, refetch } = useCursos();

// Evaluaciones
import { useEvaluaciones } from './hooks/useEvaluaciones';
const { evaluaciones, loading, error, refetch } = useEvaluaciones();

// PQRS
import { usePQRS } from './hooks/usePQRS';
const { tickets, loading, error, refetch } = usePQRS();
```

### Servicios Directos

También puedes usar los servicios directamente:

```typescript
import { cursosService, evaluacionesService, pqrsService } from './services';

// Obtener todos los cursos
const cursos = await cursosService.getAll();

// Crear una evaluación
const nuevaEvaluacion = await evaluacionesService.create({
  nombre: "Parcial 1",
  descripcion: "Primera evaluación",
  cursoId: 1,
  profesorId: 1,
  tipo: "Examen",
  estado: "Borrador",
  duracionMinutos: 60,
  intentosPermitidos: 1,
  publicada: false
});

// Crear PQRS
const pqrs = await pqrsService.create({
  tipo: "Queja",
  asunto: "Problema con evaluación",
  descripcion: "No puedo acceder...",
  cursoId: 1
});
```

## 🔐 Autenticación Automática

El cliente API está configurado con interceptores que:

1. **Agregan el token automáticamente** a todas las peticiones
2. **Manejan errores 401** (sesión expirada) redirigiendo al login
3. **Muestran notificaciones** de error automáticamente

```typescript
// El token se agrega automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quimbayaeval_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📊 Manejo de Estados

Todos los hooks incluyen estados de carga y error:

```typescript
const { cursos, loading, error, refetch } = useCursos();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

return (
  <div>
    {cursos.map(curso => (
      <CursoCard key={curso.id} curso={curso} />
    ))}
  </div>
);
```

## 🔄 Refetch de Datos

Todos los hooks incluyen una función `refetch()` para recargar datos:

```typescript
const { cursos, refetch } = useCursos();

const handleCrearCurso = async (nuevoCurso) => {
  await cursosService.create(nuevoCurso);
  refetch(); // Recargar la lista
};
```

## 🎯 Filtros y Paginación

El servicio de evaluaciones soporta filtros:

```typescript
import { useEvaluaciones } from './hooks/useEvaluaciones';

// Con filtros
const { evaluaciones } = useEvaluaciones({
  estado: 'Activa',
  tipo: 'Quiz',
  cursoId: 1,
  page: 0,
  size: 10,
  sort: 'nombre',
  direction: 'ASC'
});
```

## 🛠️ Troubleshooting

### Error de CORS

Si ves errores de CORS, verifica que el backend tenga configurado:

```yaml
# application.yml
cors:
  allowed-origins: http://localhost:5173
```

### Error de Conexión

1. Verifica que el backend esté corriendo: `http://localhost:8080`
2. Verifica la variable de entorno: `VITE_API_BASE_URL`
3. Revisa la consola del navegador para más detalles

### Token Expirado

Los tokens JWT expiran después de 1 hora. El sistema redirige automáticamente al login cuando esto ocurre.

## 📝 Próximos Pasos

1. **Actualizar componentes** para usar los nuevos hooks con estados de carga
2. **Implementar manejo de errores** en formularios
3. **Agregar validaciones** antes de enviar datos
4. **Implementar refresh token** para sesiones más largas

## 📚 Documentación Adicional

- [Guía de Integración Frontend](./FRONTEND_INTEGRATION.md) - Documentación completa del API
- [Tipos TypeScript](./src/services/) - Interfaces y tipos de datos

## ✨ Características Implementadas

- ✅ Cliente HTTP configurado con Axios
- ✅ Interceptores para autenticación automática
- ✅ Manejo de errores centralizado
- ✅ Servicios para todos los módulos
- ✅ Hooks personalizados actualizados
- ✅ AuthContext integrado con backend
- ✅ Tipos TypeScript completos
- ✅ Notificaciones automáticas de error
- ✅ Redirección automática en sesión expirada
