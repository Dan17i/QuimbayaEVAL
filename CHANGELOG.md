# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2025-02-26

### 🎉 Lanzamiento Inicial

Primera versión estable de QuimbayaEVAL con integración completa al backend.

### ✨ Agregado

#### Autenticación
- Sistema de autenticación con JWT
- Login con validación de formularios
- Manejo de sesiones con localStorage
- Protección de rutas por rol
- Logout con limpieza de datos

#### Servicios
- Cliente HTTP configurado con Axios
- Interceptores para manejo automático de tokens
- Servicios para todos los módulos:
  - authService (login/registro)
  - cursosService (CRUD completo)
  - evaluacionesService (CRUD con filtros)
  - preguntasService (CRUD completo)
  - submissionsService (entregas)
  - calificacionesService (calificaciones)
  - pqrsService (sistema PQRS)

#### Hooks Personalizados
- useAuth - Gestión de autenticación
- useCursos - Gestión de cursos con estados
- useEvaluaciones - Gestión de evaluaciones con filtros
- usePQRS - Gestión de PQRS
- useLocalStorage - Persistencia en localStorage

#### Componentes
- Layout con sidebar y navegación
- ProtectedRoute para rutas protegidas
- LoadingSpinner con estados de carga
- EmptyState para estados vacíos
- ErrorBoundary para captura de errores
- Componentes de UI de Shadcn/ui

#### Páginas - Estudiante
- Dashboard con evaluaciones pendientes
- Mis Cursos con progreso
- Mis Evaluaciones con filtros
- Realizar Evaluación con timer
- Historial de calificaciones
- Sistema PQRS

#### Páginas - Maestro
- Dashboard con estadísticas
- Gestión de Evaluaciones
- Crear/Editar Evaluaciones
- Calificar Evaluaciones
- Reportes de desempeño
- Sistema PQRS

#### Páginas - Coordinador
- Dashboard global
- Gestión de Usuarios
- Reportes consolidados
- Sistema PQRS centralizado

#### Características Técnicas
- Validación de formularios con react-hook-form
- Manejo de errores específico por tipo
- Estados de carga en todas las operaciones
- Notificaciones toast con Sonner
- Optimización con useMemo
- Refetch automático de datos
- Responsive design mobile-first
- Accesibilidad WCAG 2.1 AA

#### Documentación
- README.md profesional y completo
- BACKEND_CONNECTION.md - Guía de integración
- BEST_PRACTICES.md - Mejores prácticas
- TROUBLESHOOTING.md - Solución de problemas
- QUICK_START.md - Inicio rápido
- CONTRIBUTING.md - Guía de contribución
- Ejemplos de código en src/examples/

### 🔧 Mejorado

#### LoginPage
- Validación completa de formularios
- Manejo específico de errores (401, Network)
- Estados de carga con spinner
- Credenciales de prueba visibles
- Mensajes descriptivos

#### DashboardEstudiante
- Uso correcto de hooks con filtros
- useMemo para optimización
- Manejo de errores con refetch
- LoadingSpinner durante carga
- EmptyState con opción de reintentar

#### PQRSPage
- Integración real con pqrsService
- Validación de formularios
- Estados de carga durante submit
- Refetch automático después de crear
- Manejo de errores con try-catch

#### AuthService
- Manejo específico de errores HTTP
- Detección de errores de red
- Mensajes descriptivos por tipo de error

### 🐛 Corregido

- Error de conexión con backend no mostraba mensaje descriptivo
- Validación de email no funcionaba correctamente
- Estados de carga no se mostraban en algunos componentes
- Errores no permitían reintentar operaciones
- Formularios no validaban campos requeridos

### 🔒 Seguridad

- Implementación de JWT para autenticación
- Validación de tokens en cada petición
- Redirección automática en sesión expirada
- Sanitización de inputs en formularios
- Protección de rutas por rol

### 📝 Documentación

- Documentación completa del API
- Guías de mejores prácticas
- Ejemplos de código
- Troubleshooting detallado
- Guía de contribución

---

## [0.9.0] - 2025-02-20

### 🎨 Pre-lanzamiento

Versión beta con funcionalidades principales implementadas.

### ✨ Agregado

- Estructura base del proyecto
- Componentes de UI con Shadcn/ui
- Páginas principales por rol
- Mock data para desarrollo
- Routing con React Router
- Estilos con Tailwind CSS

### 🔧 Mejorado

- Optimización de componentes
- Mejora de responsive design
- Accesibilidad básica

---

## [0.5.0] - 2025-02-10

### 🚀 Alpha

Primera versión funcional con mock data.

### ✨ Agregado

- Prototipo de UI
- Navegación básica
- Componentes principales
- Mock data inicial

---

## Tipos de Cambios

- `✨ Agregado` - Para nuevas funcionalidades
- `🔧 Mejorado` - Para cambios en funcionalidades existentes
- `🐛 Corregido` - Para corrección de bugs
- `🔒 Seguridad` - Para cambios relacionados con seguridad
- `📝 Documentación` - Para cambios en documentación
- `🎨 Estilos` - Para cambios que no afectan la funcionalidad
- `⚡ Performance` - Para mejoras de rendimiento
- `♻️ Refactorización` - Para cambios de código sin cambiar funcionalidad
- `🧪 Tests` - Para agregar o modificar tests
- `🔥 Eliminado` - Para funcionalidades eliminadas
- `⚠️ Deprecado` - Para funcionalidades que serán eliminadas

---

## Links

- [Repositorio](https://github.com/tu-usuario/quimbayaeval-front)
- [Issues](https://github.com/tu-usuario/quimbayaeval-front/issues)
- [Pull Requests](https://github.com/tu-usuario/quimbayaeval-front/pulls)
