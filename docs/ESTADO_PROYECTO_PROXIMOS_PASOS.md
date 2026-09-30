# 📌 Bitácora de Estado del Proyecto y Próximos Pasos

**Proyecto:** QuimbayaEVAL (Sistema Integral de Evaluaciones Académicas)  
**Fecha de corte:** 30 de Septiembre de 2026  
**Autor:** Dan17i `<daniele.juradoc@uqvirtual.edu.co>`  
**Últimos Commits:**
- **Backend (`quimbayaeval-backend`):** `ca3b1a5` (*refactor(backend): consolidar lógica de negocio, autocalificación, batch y DTOs enriquecidos*)
- **Frontend (`quimbayaEVAL-front`):** `ba343e5` (*feat(api-integration): consumir DTOs enriquecidos, batch grading y SLA institucional (v1.8.0)*)

---

## 1. Resumen Ejecutivo de lo Realizado en la Sesión

### A. Consolidación y Refactorización del Backend (`quimbayaeval-backend`)
1. **Fase 1: Submissions y Calificaciones Transaccionales:**
   - Creados DTOs `SubmissionDetalleDTO`, `CalificacionBatchRequestDTO`, `CalificacionItemDTO`.
   - Implementadas consultas SQL con `JOIN` en `SubmissionDao.java` (`findDetallesByEvaluacion`, `findDetalleById`, `findDetallesByEstudiante`), erradicando las consultas n+1 y uniones en cliente.
   - Autocalificación automática en `CalificacionService.java` para preguntas objetivas (`seleccion_multiple` y `verdadero_falso`) al radicar una entrega, actualizando o generando el `Resultado` consolidado.
   - Endpoint atómico `POST /api/calificaciones/batch` que califica reactivos, recalcula puntaje y guarda observaciones docentes en una única transacción.
2. **Fase 2: Banco de Reactivos y Evaluaciones:**
   - Reordenamiento masivo atómico con `PUT /api/preguntas/reordenar` (`PreguntaDao.updateOrdenBatch`).
   - Validación de negocio en `EvaluacionService.publicar()`: rechazo con HTTP 400 descriptivo si la evaluación carece de preguntas.
   - Duplicación transaccional profunda `POST /api/evaluaciones/{id}/duplicar` con clonación de reactivos.
   - Endpoint canónico de entrega `POST /api/evaluaciones/{id}/submit`.
3. **Fase 3: PQRS, Trazabilidad y SLA Legal de 15 Días:**
   - Creado `PQRSDetalleDTO` con cálculo matemático automático de días transcurridos y categorización de SLA (`A_TIEMPO`, `PROXIMO_A_VENCER`, `VENCIDO`, `ATENDIDO_A_TIEMPO`, `ATENDIDO_FUERA_DE_PLAZO`).
   - Endpoints `GET /api/pqrs/detalles` y `GET /api/pqrs/{id}/detalle` con vinculación a remitente, docente/coordinador y curso.
4. **Garantía de Calidad:**
   - Creados tests `CalificacionServiceTest`, `PQRSDetalleDTOTest`, ajustado `EvaluacionControllerIntegrationTest` y `PreguntaServiceTest`.
   - **Resultado:** 237 de 237 pruebas unitarias y de integración pasando al 100% (`BUILD SUCCESS`).

---

### B. Integración y Rendimiento en Frontend (`quimbayaEVAL-front`)
1. **Eliminación de *Client-Side Joins*:**
   - `CalificarPage.tsx` ahora consume `submissionsService.getDetallesByEvaluacion()`. Los nombres, correos y documentos de los estudiantes vienen directamente en la carga inicial, eliminando la llamada masiva a `usersService.getAll()`.
   - Reemplazado el ciclo de peticiones asíncronas por `calificacionesService.calificarBatch()`, persistiendo las notas de todas las preguntas y la retroalimentación docente en un solo clic.
2. **Módulo PQRS con SLA Institucional:**
   - `usePQRS.ts` y `PQRSPage.tsx` conectados a `pqrsService.getDetalles()`.
   - Integrados badges visuales semánticos de alto contraste indicando el cumplimiento del SLA de 15 días, días transcurridos y el nombre del responsable que atendió la solicitud.
3. **Operaciones de Evaluaciones:**
   - `EvaluacionesPage.tsx`: agregada acción "Duplicar" en el menú contextual vía `evaluacionesService.duplicar()`.
   - Manejo amigable y comprensivo de errores al publicar evaluaciones sin preguntas.
4. **Rendición de Pruebas:**
   - `RealizarEvaluacionPage.tsx` conectado al endpoint canónico `evaluacionesService.submit()` con fallback resiliente y feedback de autocalificación inmediata.
5. **Compilación y Empaquetado:**
   - `npm run typecheck` completado con 0 errores.
   - `npm run build` completado exitosamente (bundle de producción listo).
   - Registrado en `CHANGELOG.md` como versión `[1.8.0]`.

---

## 2. Matriz de Estado de las Páginas del Frontend

| Página / Módulo | Estado Funcional | Nivel HCI / DCU | Integración API |
| :--- | :---: | :---: | :---: |
| `LoginPage.tsx` | ✅ Completado | Alto (Validación tiempo real, credenciales demo) | `authService` |
| `CrearEvaluacionPage.tsx` | ✅ Completado | Alto (Bimodal crear/editar, 4 tipos preguntas, cálculo 5.0) | `evaluacionesService` / `preguntasService` |
| `EvaluacionesPage.tsx` | ✅ Completado | Alto (Filtros, duplicación 1 clic, publicar) | `evaluacionesService` |
| `UsuariosPage.tsx` | ✅ Completado | Alto (Paginación, edición modal, cambio rol) | `usersService` |
| `CursosAdminPage.tsx` | ✅ Completado | Alto (Buscador instantáneo, desmatriculación segura) | `cursosService` |
| `DashboardEstudiante.tsx` | ✅ Completado | Alto (Banner rápido de pruebas activas, métricas) | `useEvaluaciones` / `useCursos` |
| `MisEvaluacionesPage.tsx` | ✅ Completado | Alto (Ficha técnica modal de prueba, filtros) | `useEvaluaciones` |
| `HistorialPage.tsx` | ✅ Completado | Alto (Desglose pregunta a pregunta, notas SENA) | `submissionsService` / `calificacionesService` |
| `MisCursosPage.tsx` | ✅ Completado | Alto (Búsqueda en vivo, cursos con pendientes) | `useCursos` |
| `CalificarPage.tsx` | ✅ Completado | Alto (Batch grading, sin client-joins, escala 5.0) | `calificacionesService.calificarBatch` |
| `ReportesPage.tsx` | ✅ Completado | Alto (Modo dual, barras accesibles, notas 0.0-5.0) | `resultadosService` |
| `PQRSPage.tsx` | ✅ Completado | Alto (SLA 15 días visible, filtros, respuesta docente) | `pqrsService.getDetalles` |
| `RealizarEvaluacionPage.tsx` | ✅ Completado | Alto (Timer, borrador en localStorage, submit canónico) | `evaluacionesService.submit` |
| `PerfilPage.tsx` | ✅ Completado | Alto (Validación tiempo real, cambio clave seguro, preview avatar, sync AuthContext) | `usersService` |
| `DashboardCoordinador.tsx` | ✅ Completado | Alto (KPIs globales reales, auditoría PQRS SLA 15d, alertas de urgencia y gráficas) | Múltiples servicios |
| `CursoDetallePage.tsx` | ✅ Completado | Alto (Ficha técnica enriquecida, aprendices matriculados, promedio y métricas) | `cursosService` / `usersService` |

---

## 3. Próximos Pasos Prioritarios al Reanudar la Sesión

### **Paso 1: Módulo de Perfil del Usuario (`PerfilPage.tsx`) — ✅ COMPLETADO**
- Corregida brecha de seguridad en `SecurityConfig.java` permitiendo a todos los usuarios autenticados acceder a `/api/users/me` y `/api/users/me/password`.
- `UserController.java` actualizado para retornar el DTO de perfil enriquecido tras actualización en `PUT /api/users/me`.
- Agregado campo `fotoUrl` en `LoginResponse` para inicialización instantánea de avatar.
- 4 nuevos tests de integración en `UserControllerIntegrationTest` pasando al 100% (241/241 en toda la suite).
- Rediseño con estándar SENA en `PerfilPage.tsx`: preview ergonómico de imagen, correo institucional protegido, confirmación y validación de contraseña con `PasswordInput`, micro-estadísticas y sincronización directa con `AuthContext`.

### **Paso 2: Dashboard del Coordinador (`DashboardCoordinador.tsx`) y Ficha de Curso (`CursoDetallePage.tsx` / `CursoMaestroPage.tsx`) — ✅ COMPLETADO**
- Consolidado en `DashboardCoordinador.tsx` el módulo institucional de **Auditoría de PQRS y Cumplimiento Legal (SLA 15 Días)**: cálculo reactivo de % de cumplimiento, alertas de urgencia para tickets vencidos o por vencer con enlace directo de resolución, y conteo global de aprendices e instructores activos.
- Enriquecido `CursoMaestroPage.tsx` con la pestaña **Estudiantes Matriculados** (buscador en tiempo real, conteo de aprendices y estado de matrícula).
- Enriquecido `CursoDetallePage.tsx` con ficha técnica del curso, badge del instructor asignado, micro-métricas de promedio/evaluaciones y lista desplegable de compañeros matriculados.
- Verificación con `npm run typecheck` (0 errores) y `npm run build` exitoso.

### **Paso 3: Prueba de Humo de Flujo Completo End-to-End (`FlujoCompletoEndToEndTest.java`) — ✅ COMPLETADO**
- Implementado el test de integración automatizado completo en Spring Boot MockMvc: [`FlujoCompletoEndToEndTest.java`](file:///C:/Users/DANIEL-PC/Documents/bases%20SENA/quimbayaeval-backend/src/test/java/com/quimbayaeval/controller/FlujoCompletoEndToEndTest.java).
- Validados los 4 eslabones de la cadena de valor institucional:
  1. **Creación y Publicación Docente:** Creación de evaluación con 3 preguntas (opción múltiple, V/F y abierta) y publicación inmediata.
  2. **Rendición y Autocalificación:** Aprendiz presenta examen; autocalificación instantánea de preguntas objetivas (3.5/5.0 puntos -> nota 3.8 en escala SENA).
  3. **Batch Grading y Reporte Consolidado:** Instructor califica reactivo abierto con retroalimentación cualitativa en lote atómico; verificación del 100% (nota 5.0) en reporte del curso.
  4. **PQRS y Cumplimiento Legal (SLA 15 Días):** Aprendiz radica petición, Coordinador consulta auditoría con SLA `A_TIEMPO` y resuelve la solicitud quedando en estado `ATENDIDO_A_TIEMPO`.
- Corregido bug crítico en [`SubmissionDao.java`](file:///C:/Users/DANIEL-PC/Documents/bases%20SENA/quimbayaeval-backend/src/main/java/com/quimbayaeval/dao/SubmissionDao.java) donde `SQL_INSERT` omitía `respuestas_json` y `fecha_envio` al persistir el envío.
- Verificación exhaustiva: **242 / 242 tests pasando** al 100% en backend (`mvn test`) y **0 errores de TypeScript** en frontend (`npm run typecheck`).

