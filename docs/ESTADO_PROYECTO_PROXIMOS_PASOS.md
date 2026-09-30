# 📌 Bitácora de Estado del Proyecto y Próximos Pasos

**Proyecto:** QuimbayaEVAL (Sistema Integral de Evaluaciones Académicas)  
**Fecha de corte:** 30 de Septiembre de 2026  
**Autor:** Dan17i `<daniele.juradoc@uqvirtual.edu.co>`  

---

## 1. Resumen Ejecutivo de lo Realizado en la Sesión de Hoy

### A. Consolidación y Refactorización del Backend (`quimbayaeval-backend`)
1. **Seguridad y Perfil de Usuario (`UserController.java` y `SecurityConfig.java`):**
   - Corregida brecha en `SecurityConfig.java` permitiendo a todos los usuarios autenticados acceder a `/api/users/me` y `/api/users/me/password` sin restricción exclusiva a coordinadores.
   - `UserController.java` actualizado para retornar el DTO de perfil enriquecido tras actualización en `PUT /api/users/me`.
   - Agregado campo `fotoUrl` en `LoginResponse` para inicialización reactiva del avatar.
   - Incorporados 4 tests en `UserControllerIntegrationTest` pasando al 100%.
2. **Corrección Crítica en `SubmissionDao.java`:**
   - Detectado y corregido bug en `SQL_INSERT` y método `save` que omitía almacenar `respuestas_json` y `fecha_envio`, garantizando la autocalificación instantánea y la persistencia de respuestas.
3. **Prueba de Humo de Flujo Completo End-to-End (`FlujoCompletoEndToEndTest.java`):**
   - Validado el ciclo vital completo de la plataforma en 4 etapas:
     - Creación y publicación de examen con 3 reactivos.
     - Rendición del aprendiz y autocalificación instantánea (nota 3.8/5.0).
     - Calificación docente en lote atómico (*batch grading*) y consolidación de nota (5.0/5.0).
     - Radicación de PQRS con verificación del SLA de 15 días y respuesta formal del coordinador.
4. **Garantía de Calidad:**
   - **242 de 242 pruebas unitarias y de integración pasando al 100%** (`BUILD SUCCESS`).

---

### B. Mejoras de Experiencia de Usuario y UI en Frontend (`quimbayaEVAL-front`)
1. **Módulo de Perfil del Usuario (`PerfilPage.tsx`):**
   - Rediseño con identidad visual SENA: avatar con preview en vivo, correo institucional protegido, confirmación y validación de contraseña con `PasswordInput`, micro-estadísticas y sincronización inmediata con `AuthContext`.
2. **Dashboard del Coordinador (`DashboardCoordinador.tsx`):**
   - Integrado módulo de **Auditoría de PQRS y Cumplimiento Legal (SLA 15 Días)**: cálculo reactivo de % de cumplimiento, alertas de urgencia para tickets vencidos o por vencer y enlaces de resolución directa.
3. **Fichas Técnicas de Curso (`CursoMaestroPage.tsx` y `CursoDetallePage.tsx`):**
   - Incorporada pestaña de **Estudiantes Matriculados** con buscador en tiempo real, conteo de aprendices y estado de matrícula en la vista del instructor.
   - Enriquecida la vista del estudiante con datos del docente a cargo, promedio de notas y compañeros matriculados.
4. **Dashboard del Instructor (`DashboardMaestro.tsx`):**
   - Añadido grid superior de micro-KPIs (Cursos, Por Calificar, PQRS en Trámite, SLA 15d).
   - Incorporado widget interactivo de **Atención de PQRS y Término Legal** con alerta prioritaria en tickets próximos o vencidos y mensaje institucional de cumplimiento.
5. **Compilación y Empaquetado:**
   - `npm run typecheck` completado con 0 errores.
   - `npm run build` completado exitosamente (bundle de producción listo en 27.20s).

---

### C. Dockerización y Despliegue Unificado
1. **Frontend:** Creado `Dockerfile` multi-stage (Node 20 Alpine + Nginx Alpine) y `nginx.conf` optimizado con compresión Gzip, caché inmutable y proxy reverso `/api/` que elimina problemas de CORS.
2. **Backend:** Creado `.dockerignore` para optimizar contexto de construcción.
3. **Orquestación Global:** Creado `docker-compose.yml` en la raíz del proyecto para levantar PostgreSQL 15, Spring Boot 3 y React Nginx con un único comando (`docker compose up -d --build`).
4. **Documentación:** Creada guía de despliegue en `docs/DESPLIEGUE_DOCKER.md`.

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
| `ReportesPage.tsx` | ✅ Completado | Alto (Modo dual, barras accesibles, notas 0.0-5.0, exportación PDF/XLSX) | `resultadosService` |
| `PQRSPage.tsx` | ✅ Completado | Alto (SLA 15 días visible, filtros, respuesta docente) | `pqrsService.getDetalles` |
| `RealizarEvaluacionPage.tsx` | ✅ Completado | Alto (Timer, borrador en localStorage, submit canónico) | `evaluacionesService.submit` |
| `PerfilPage.tsx` | ✅ Completado | Alto (Validación tiempo real, cambio clave seguro, preview avatar, sync AuthContext) | `usersService` |
| `DashboardMaestro.tsx` | ✅ Completado | Alto (KPIs rápidos, evaluaciones por calificar, auditoría PQRS SLA 15d y alerta de urgencia) | `cursosService` / `evaluacionesService` / `pqrsService` |
| `DashboardCoordinador.tsx` | ✅ Completado | Alto (KPIs globales reales, auditoría PQRS SLA 15d, alertas de urgencia y gráficas) | Múltiples servicios |
| `CursoMaestroPage.tsx` | ✅ Completado | Alto (Ficha técnica del instructor, pestaña de estudiantes matriculados y buscador) | `cursosService` / `usersService` |
| `CursoDetallePage.tsx` | ✅ Completado | Alto (Ficha técnica enriquecida, aprendices matriculados, promedio y métricas) | `cursosService` / `usersService` |

---

## 3. Avances de Automatización y Calidad (Sesión Actual)

### 🧪 **Suite de Pruebas Automatizadas de Frontend (Vitest / Testing Library): ✅ Completado**
- Entorno configurado con Vitest 3.2, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` y `jsdom`.
- **36 de 36 pruebas pasando al 100%** en 6 suites:
  - `PasswordInput.test.tsx` (5 tests)
  - `slaUtils.test.ts` (12 tests) — Ley 1755 / SLA institucional 15 días
  - `usePQRS.test.ts` (6 tests) — Mapeo, estados, filtros y resolución
  - `PerfilPage.test.tsx` (4 tests) — Validaciones, reactividad y actualización
  - `validation.test.ts` (4 tests) — Emails, formato de clave y campos requeridos
  - `format.test.ts` (5 tests) — Notas 0.0 a 5.0, duraciones y porcentajes
- TypeScript typecheck con 0 errores y compilación de producción validada.

### ⚙️ **Pipelines de Integración Continua (CI/CD con GitHub Actions): ✅ Completado**
- **Backend (`quimbayaeval-backend/.github/workflows/ci.yml`):**
  - Checkout, configuración de JDK 17 Temurin con caché Maven.
  - Generado Maven Wrapper (`mvnw` / `mvnw.cmd`).
  - Compilación, ejecución de 242 pruebas automatizadas y empaquetado del JAR.
  - Almacenamiento de reportes Surefire como artefacto.
- **Frontend (`quimbayaEVAL-front/.github/workflows/ci.yml`):**
  - Checkout, Node.js 20 con caché de npm (`npm ci`).
  - Verificación estática con `npm run typecheck`.
  - Ejecución de la suite completa de 36 pruebas con `npm test`.
  - Construcción del paquete de producción con `npm run build` y carga de artefacto `dist/`.

---

## 4. Próximos Pasos Disponibles

### 🎯 **Paso 1: Validación y Prueba de Despliegue con Docker**
- Ejecutar `docker compose up -d --build` desde la raíz para verificar el arranque sincronizado de los 3 contenedores:
  - `quimbayaeval-db` (PostgreSQL 15 en puerto 5433).
  - `quimbayaeval-backend` (Spring Boot en puerto 8080).
  - `quimbayaeval-front` (Nginx en puerto 3000).
- Verificar que el proxy reverso `/api/` en Nginx conecte correctamente con el backend sin errores de CORS.

### 📱 **Paso 2: Demostración Interactiva en Vivo y Cierre de Proyecto**
- Prueba de humo visual en navegador navegando con los tres roles:
  - **Aprendiz:** Login -> Ver cursos -> Rendir prueba con autocalificación -> Radicar PQRS.
  - **Maestro:** Login -> Ver dashboard con alerta SLA -> Calificar batch -> Ver reporte de curso.
  - **Coordinador:** Login -> Ver auditoría SLA PQRS -> Responder ticket -> Ver estadísticas globales.
