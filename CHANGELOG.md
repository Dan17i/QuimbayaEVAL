# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.7.0] - 2026-09-29

### 📊 HCI & DCU - Bloque 6: Reportes Académicos y Analítica Visual Inclusiva
- **Analítica Gráfica Inclusiva y Accesible (`ReportesPage.tsx`):**
  - **Selector de Modo de Visualización (HCI):** Incorporado control ergonómico para alternar entre dos modos de análisis:
    - *Modo Distribución (Aprobados vs Reprobados):* Gráfica de barras dobles con paleta accesible de alto contraste (Azul `#2563eb` y Rojo `#dc2626`) optimizada para usuarios con daltonismo, leyenda explícita y tooltips cuantitativos detallados.
    - *Modo Calificaciones (Escala SENA 0.0 - 5.0):* Corregido el eje Y (`domain={[0, 5]} unit=" pts"`) que antes operaba en porcentaje ficticio y distorsionado (haciendo que notas de 4.0 se renderizaran diminutas al 4%). Integrada línea de referencia (`ReferenceLine`) en `3.0 pts` con etiqueta destacada de umbral mínimo aprobatorio.
- **Corrección de Indicadores Clave de Desempeño (KPIs):**
  - Subsanado bug visual donde la calificación promedio absoluta (ej. `3.8`) se desplegaba con signo de porcentaje erróneo (`3.8%`), transformándolo a notación pedagógica clara (`3.8 / 5.0`) acompañada del subtexto porcentual de rendimiento global equivalente (`76%`).
  - Agregado KPI de Tasa de Aprobación real del grupo con conteo de evaluaciones superadas y KPI de Riesgo Académico para intervenciones formativas oportunas.
- **Barra de Búsqueda Reactiva y Paginación Ergonómica en Notas Individuales:**
  - Integrado campo de búsqueda interactivo con icono `Search` para filtrar instantáneamente por nombre de estudiante, correo, documento o evaluación.
  - Añadido selector reactivo de estado de aprobación (`Todos`, `Solo Aprobados`, `Solo Reprobados`) con conteos en vivo.
  - Implementada paginación ergonómica y accesible (8 registros por página) con navegación "Anterior/Siguiente", numeración de páginas y contador de resultados, previniendo sábanas verticales interminables y sobrecarga cognitiva.
  - Avatar con iniciales, formato monoespaciado para documentos administrativos y micro-barras de progreso de rendimiento individual.
- **Detalle Cuantitativo Consolidado por Instrumento:**
  - Incorporada columna de Tasa de Aprobación con micro-barras porcentuales de rendimiento en la tabla de resumen grupal.
  - Reseteo automático de página al modificar filtros o cambiar de curso.

## [1.6.0] - 2026-09-29

### 👨‍🏫 HCI & DCU - Bloque 5: Experiencia del Docente y Calificación Ergonómica
- **Rediseño Integral de la Interfaz de Calificación (`CalificarPage.tsx`):**
  - **Identificación Humana y Empatía (DCU):** Integración con `usersService.getAll()` para desplegar nombres reales y correos de los estudiantes en lugar de identificadores anónimos (`Estudiante #X`).
  - **Carga y Resguardo de Calificaciones Previas:** Al cambiar de estudiante, se recuperan automáticamente las notas y retroalimentaciones ya existentes mediante `calificacionesService.getBySubmission()`, evitando sobreescritura con ceros o pérdida de información.
  - **Autoevaluación Tentativa Asistida:** En preguntas de opción múltiple y verdadero/falso, el sistema contrasta la respuesta del estudiante con `respuestaCorrectaJson` y sugiere el puntaje máximo preliminar con indicador visual de coincidencia.
  - **Retroalimentación Cualitativa por Pregunta:** Se reemplazó la duplicación del feedback global por campos de retroalimentación individuales por pregunta con botones de comentarios formativos rápidos ("¡Excelente!", "Incompleta").
  - **Ergonomía de Puntuación (Ley de Fitts):** Atajos rápidos de 1 clic para asignar `0 pts`, `50%` o `Puntaje Máximo`, reduciendo la fatiga motriz del docente.
  - **Cálculo Dinámico en Escala SENA 5.0:** Consola de resumen con nota final sobre 5.0 y badge de estado (`Aprobado` / `Reprobado`) con flujo continuo de "Guardar y Siguiente".
  - **Sidebar Filtrable y Accesible:** Buscador por nombre/correo de estudiante y filtro por estado (Todos / Pendientes / Listas) con barra de progreso de revisión.
- **Acceso Directo a Calificaciones Pendientes (`DashboardMaestro.tsx`):**
  - Incorporado banner prioritario con accesos directos hacia evaluaciones cerradas con entregas pendientes de revisión.
- **Optimización de Acciones de Curso (`CursoMaestroPage.tsx`):**
  - Estandarizadas acciones de `EvalCard` con botones explícitos para "Calificar Entregas" y "Revisar Entregas".
- **Garantía Transaccional en Backend (`CalificacionService.java`):**
  - Anotación `@Transactional` en método `actualizar` con recálculo automático de resultados agregados vía `resultadoDao.upsertFromSubmission()`.

## [1.5.0] - 2026-09-29

### 🎓 HCI & DCU - Bloque 4: Dashboard y Experiencia Completa del Estudiante
- **Corrección de Enlace Roto y Modal de Ficha Técnica (`MisEvaluacionesPage.tsx`):**
  - Reemplazado botón inerte/enlace roto a `/mis-evaluaciones/:id` por un diálogo modal accesible (`Dialog`) con detalles completos de la evaluación: curso, docente, estado, fecha de apertura/cierre, tiempo límite, intentos configurados e instrucciones previas con recomendaciones de conectividad y honestidad académica.
  - Conectado botón de acción contextual según estado: "Iniciar Evaluación Ahora" (para activas), "Ver Retroalimentación" (para cerradas) o "Entendido" (para programadas).
  - Integrado buscador en tiempo real sobre evaluaciones abiertas, próximas y cerradas.
  - Vinculado botón "Ver Feedback" con query param (`?evaluacionId=X`) hacia el historial.
- **Visualización Detallada de Retroalimentación y Respuestas (`HistorialPage.tsx`):**
  - Incorporado modal interactivo de retroalimentación pedagógica (`Dialog`) que desglosa la entrega del estudiante pregunta por pregunta.
  - Muestra puntuación obtenida vs valor total de la pregunta, respuesta registrada del estudiante y observaciones cualitativas del docente destacadas con iconos semánticos.
  - Soporte de apertura automática mediante parámetro `?evaluacionId=` recibido desde la navegación de evaluaciones cerradas.
  - Añadido buscador en tiempo real por evaluación/curso/docente y filtro interactivo por estado de aprobación (Todos / Aprobado / Reprobado).
- **Acceso Rápido a Evaluaciones Activas (`DashboardEstudiante.tsx`):**
  - Añadido banner prioritario interactivo con accesos directos de 1 clic ("Rendir") para las pruebas activas próximas a vencer, minimizando la carga cognitiva y pasos de navegación del estudiante.
- **Buscador y Filtro de Cursos Pendientes (`MisCursosPage.tsx`):**
  - Añadido campo de búsqueda en vivo de cursos matriculados.
  - Añadido filtro por cursos con evaluaciones pendientes y botones de acceso directo hacia las pruebas del curso.
- **Enriquecimiento del Modelo de Evaluaciones (`useEvaluaciones.ts` e `index.ts`):**
  - Incorporado soporte para visualización de descripciones de evaluaciones en la interfaz de usuario.

## [1.4.0] - 2026-09-29

### 👥 HCI & DCU - Bloque 3: Módulo Administrativo de Gestión de Cursos y Usuarios
- **Activación de Acciones Inertes en Gestión de Usuarios (`UsuariosPage.tsx`):**
  - Conectadas las acciones "Editar Información" y "Cambiar Rol" en el menú de usuario.
  - Implementado modal accesible para editar nombre, correo y rol del usuario con persistencia en el backend (`usersService.update`).
  - Implementado diálogo de cambio rápido de rol entre Estudiante, Maestro y Coordinador con retroalimentación inmediata.
- **Paginación Funcional en Tablas (`UsuariosPage.tsx` y `CursosAdminPage.tsx`):**
  - Sustituidos botones inertes permanentemente deshabilitados por paginación interactiva reactiva (`currentPage`, `pageSize = 8`, `totalPages`).
  - Reseteo automático a página 1 al interactuar con filtros de búsqueda o roles.
  - Indicador numérico de rango visible ("Mostrando X–Y de Z").
- **Búsqueda Instantánea de Cursos (`CursosAdminPage.tsx`):**
  - Integrado componente `SearchInput` con debounce de 300ms para filtrar cursos por código, nombre o docente asignado.
- **Prevención de Errores en Desmatriculación (HCI Heurística #5):**
  - Añadido diálogo de confirmación destructiva (`ConfirmDialog`) antes de desmatricular a un estudiante de un curso, evitando desvinculaciones por clics accidentales.
- **Extensión de API Administrativa en Backend (`quimbayaeval-backend`):**
  - Implementado endpoint `PUT /api/users/{id}` en `UserController.java` para actualización coordinada de datos de usuario (nombre, email, rol).
  - Agregado método `update` en `usersService.ts` en el frontend.

## [1.3.0] - 2026-09-29

### 📝 HCI & DCU - Bloque 2: Formulario Completo de Creación y Edición de Evaluaciones
- **Soporte Bimodal (Creación y Edición):**
  - Detección reactiva de modo a través de parámetros de ruta (`/evaluaciones/nueva` vs. `/evaluaciones/:id/editar`).
  - Carga asíncrona de datos de evaluación existente y banco de preguntas (`evaluacionesService.getById` y `preguntasService.getByEvaluacion`).
  - Mapeo bidireccional y robusto de fechas y formatos de cierre (`deadline`) compatibles con `datetime-local` y `LocalDateTime` de Spring Boot.
- **Gestión Dinámica e Interactiva de Preguntas:**
  - Soporte completo y enlazado bidireccionalmente para 4 tipos de preguntas: Opción Múltiple (`seleccion_multiple`), Verdadero/Falso (`verdadero_falso`), Respuesta Corta (`respuesta_corta`) y Pregunta Abierta/Ensayo (`ensayo`).
  - Selección interactiva de la respuesta correcta mediante radio buttons tanto en opción múltiple como en verdadero/falso.
  - Reordenamiento visual arriba/abajo (`movePregunta`), duplicación instantánea (`duplicatePregunta`) y eliminación con seguimiento de IDs remotos (`deletedPreguntaIds`) para limpieza garantizada en la base de datos.
- **Cálculo Automático y Distribución de Puntos (HCI / Heurística #1 & #6):**
  - Visualización en tiempo real del puntaje acumulado total y cantidad de preguntas formuladas.
  - Herramienta de distribución equitativa de puntuación con ajuste automático de residuo sobre escala 5.0 pts, escala 100 pts o 1.0 pt por pregunta.
  - Navegación rápida por índice lateral con desplazamiento suave (`scrollIntoView`) hacia cada tarjeta de pregunta.
- **Validación Preventiva y Persistencia Integral:**
  - Validación específica según la acción: diferenciación entre "Guardar Borrador" (validación básica) y "Publicar Ahora" (validación estricta de contenidos, enunciados y respuestas correctas).
  - Persistencia secuencial garantizada: creación/actualización de la evaluación y sincronización atómica de sus preguntas mediante `preguntasService`.
- **Modal de Vista Previa del Estudiante:**
  - Incorporación de diálogo accesible (`Dialog`) para previsualizar exactamente cómo el estudiante visualizará la prueba, opciones, cronómetro y preguntas antes de publicarla.

## [1.2.0] - 2026-09-29

### 🖱️ HCI & DCU - Bloque 1: Reparación de Botones Inertes y Enlaces Rotos
- **Activación de Publicación de Evaluaciones:**
  - Agregado método `publicar(id: number): Promise<string>` en `evaluacionesService.ts` apuntando al endpoint `POST /api/evaluaciones/{id}/publicar`.
  - Reemplazado toast simulado "Funcionalidad próximamente" en `EvaluacionesPage.tsx` por ejecución real asíncrona contra el backend con feedback reactivo `toast.success` y recarga en tiempo real mediante `refetch()`.
  - Añadido botón "Publicar" directo en `CursoMaestroPage.tsx` para evaluaciones en estado `Borrador`.
- **Reparación de Enlaces e Incompatibilidad de Parámetros:**
  - Corregido el parámetro de navegación de "Calificar" en `CursoMaestroPage.tsx` para estandarizar `?id=${e.id}`.
  - Saneada la recepción de parámetros en `CalificarPage.tsx` aceptando tanto `id` como `evaluacionId` (`searchParams.get('id') || searchParams.get('evaluacionId')`), previniendo expulsión indebida del docente hacia `/evaluaciones`.
- **Enrutamiento de Edición de Evaluaciones:**
  - Registrada la constante `ROUTES.EDITAR_EVALUACION = '/evaluaciones/:id/editar'` en `routes.ts`.
  - Registrada la ruta protegida `/evaluaciones/:id/editar` en `App.tsx` apuntando a `CrearEvaluacionPage.tsx`.
  - Conectado el botón inerte "Editar" en `CursoMaestroPage.tsx` a su correspondiente ruta de edición.
- **Prevención de Pérdida de Datos en Exámenes (HCI Heurística #5):**
  - Implementado listener `beforeunload` en `RealizarEvaluacionPage.tsx` para alertar al estudiante ante intentos accidentales de cerrar la pestaña, recargar o navegar hacia atrás mientras una evaluación activa no haya sido enviada.

## [1.1.0] - 2026-09-29

### 🔧 Correcciones y Estabilización de Tipos (Fase 2)
- **Alineación de tipos con React 18:** Ajustados `@types/react` a `^18.3.18` y `@types/react-dom` a `^18.3.5` para garantizar compatibilidad con React 18.2.
- **Resolución integral de errores TypeScript:**
  - Corregidos imports faltantes en `DataTable.tsx` (`FileText` y `type LucideIcon`).
  - Corregidas llamadas con tipos mixtos `string`/`number` en `CrearEvaluacionPage.tsx`, `DashboardMaestro.tsx` y `RealizarEvaluacionPage.tsx`.
  - Reemplazo de palabra reservada `eval` por `item` y uso de `item.name` en `EjemploUsoServicios.tsx`.
  - Inclusión de `cursoId` requerido en los objetos de prueba de `mockData.ts`.
  - Independencia de tipos en `debounce.ts` usando `ReturnType<typeof setTimeout>`.
- **Limpieza de parches de API:**
  - Eliminado el parche de supresión de error de `KeyHolder` en `api.ts`.
  - Eliminada la extracción por regex en `pqrsService.ts` tras la resolución de base en el backend.
  - Parámetro `destinatario` marcado como opcional en `CreatePQRSRequest`.
- **Limpieza del repositorio:**
  - Eliminada la carpeta residual huérfana `backend/` dentro del frontend.
  - Agregado script `npm run typecheck` (`tsc --noEmit`).

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
