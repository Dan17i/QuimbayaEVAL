<div align="center">

# QuimbayaEVAL — Frontend

**Plataforma web de gestión de evaluaciones académicas**  
Desarrollada para el Centro de Formación Quimbaya · SENA

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](./LICENSE)

[Inicio rápido](#-inicio-rápido) · [Arquitectura](#-arquitectura) · [Roles](#-roles-y-flujos) · [API](#-integración-con-el-backend) · [Contribuir](#-contribuir)

</div>

---

## Descripción general

QuimbayaEVAL es una SPA (Single Page Application) construida con React y TypeScript que sirve como capa de presentación para el sistema de evaluaciones académicas. Se conecta a un backend Spring Boot mediante una API REST y gestiona tres perfiles de usuario con flujos completamente diferenciados: **estudiante**, **maestro** y **coordinador**.

El proyecto sigue un enfoque de **drill-down por curso**: en lugar de vistas globales con datos mezclados, cada usuario trabaja dentro del contexto de un curso específico, reduciendo la carga cognitiva y los errores de operación.

---

## Tabla de contenidos

- [Stack tecnológico](#-stack-tecnológico)
- [Inicio rápido](#-inicio-rápido)
- [Variables de entorno](#-variables-de-entorno)
- [Arquitectura](#-arquitectura)
- [Roles y flujos](#-roles-y-flujos)
- [Integración con el backend](#-integración-con-el-backend)
- [Decisiones de diseño](#-decisiones-de-diseño)
- [Contribuir](#-contribuir)

---

## 🛠 Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| UI Framework | React | 18.2 |
| Lenguaje | TypeScript | 5.9 |
| Build tool | Vite + SWC | 6.3 |
| Estilos | Tailwind CSS | 3.x |
| Componentes base | Shadcn/ui + Radix UI | — |
| Enrutamiento | React Router | 6.20 |
| HTTP client | Axios | 1.x |
| Notificaciones | Sonner | 2.x |
| Iconos | Lucide React | 0.487 |
| Exportación Excel | SheetJS (xlsx) | 0.18 |
| Exportación PDF | jsPDF + jspdf-autotable | 2.5 / 3.8 |
| Gráficas | Recharts | 2.x |

---

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js ≥ 18
- npm ≥ 9
- Backend QuimbayaEVAL corriendo (ver [Integración con el backend](#-integración-con-el-backend))

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/quimbayaeval-front.git
cd quimbayaeval-front

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env.local
# Edita .env.local con la URL de tu backend

# 4. Levantar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo con HMR
npm run build      # Build de producción (output en /dist)
npm run preview    # Preview del build de producción
```

---

## ⚙️ Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores:

```env
# URL base del backend (sin trailing slash)
VITE_API_BASE_URL=http://localhost:8081/api

# Timeout de peticiones HTTP en ms
VITE_API_TIMEOUT=10000

# Nombre de la aplicación (aparece en el título del navegador)
VITE_APP_NAME=QuimbayaEVAL
VITE_APP_VERSION=0.1.0

# Claves de localStorage para sesión
VITE_AUTH_TOKEN_KEY=quimbayaeval_token
VITE_AUTH_USER_KEY=quimbayaeval_user
```

> El puerto del backend se configura únicamente aquí. No hay valores hardcodeados en el código fuente.

---

## 🏗 Arquitectura

### Estructura de directorios

```
src/
├── pages/                  # Una página por vista/rol
│   ├── LoginPage.tsx
│   ├── DashboardEstudiante.tsx
│   ├── CursoDetallePage.tsx        # Vista de curso — estudiante
│   ├── DashboardMaestro.tsx
│   ├── CursoMaestroPage.tsx        # Vista de curso — maestro
│   ├── DashboardCoordinador.tsx
│   ├── CursosAdminPage.tsx
│   ├── UsuariosPage.tsx
│   ├── CrearEvaluacionPage.tsx
│   ├── CalificarPage.tsx
│   ├── PQRSPage.tsx
│   ├── PerfilPage.tsx
│   └── ...
│
├── components/
│   ├── ui/                 # Primitivas Shadcn/ui (no modificar)
│   ├── Layout.tsx          # Shell: sidebar + breadcrumbs + header
│   ├── ProtectedRoute.tsx  # Guard de autenticación y roles
│   ├── EmptyState.tsx
│   ├── PasswordInput.tsx
│   ├── SkeletonLoader.tsx
│   └── ...
│
├── services/               # Capa de acceso a la API REST
│   ├── api.ts              # Instancia Axios + interceptores
│   ├── authService.ts
│   ├── cursosService.ts
│   ├── evaluacionesService.ts
│   ├── submissionsService.ts
│   ├── calificacionesService.ts
│   ├── resultadosService.ts
│   ├── pqrsService.ts
│   └── usersService.ts
│
├── hooks/                  # Hooks de datos reutilizables
│   ├── useCursos.ts
│   ├── useEvaluaciones.ts
│   ├── useSubmissions.ts
│   └── usePQRS.ts
│
├── contexts/
│   └── AuthContext.tsx     # Sesión global: user, token, login/logout
│
├── types/
│   └── index.ts            # Tipos compartidos de dominio
│
├── constants/
│   ├── routes.ts           # Rutas tipadas como constantes
│   └── roles.ts
│
└── utils/
    ├── date.ts
    ├── format.ts
    ├── validation.ts
    └── debounce.ts
```

### Flujo de datos

```
Componente → Hook personalizado → Service → Axios (api.ts) → Backend REST
                                                ↑
                                    Interceptor: adjunta JWT
                                    Interceptor: maneja 401 / errores globales
```

### Autenticación

- El token JWT se almacena en `localStorage` bajo la clave `quimbayaeval_token`.
- El interceptor de request de Axios lo adjunta automáticamente en cada petición.
- Un 401 limpia la sesión y redirige a `/login`.
- Las rutas protegidas usan `<ProtectedRoute allowedRoles={[...]}>` que valida rol además de autenticación.

### Lazy loading

Todas las páginas se cargan con `React.lazy()` + `Suspense`. El bundle inicial es mínimo; cada página se descarga solo cuando el usuario la visita.

---

## 👥 Roles y flujos

### Estudiante

```
/dashboard  →  Grid de cursos inscritos
               └── /mis-cursos/:id  →  Evaluaciones (pendientes / próximas / cerradas)
                                       Calificaciones obtenidas
                                       Crear PQRS contextual al curso
/pqrs       →  Historial de PQRS propias con estado
/perfil     →  Editar nombre, foto, cambiar contraseña
```

### Maestro

```
/dashboard  →  Grid de cursos asignados (badge "X por calificar")
               └── /mis-cursos-maestro/:id  →  Tabs: Activas / Por Calificar
                                               Botón "Nueva Evaluación" (pre-llena cursoId)
                                               Reporte de notas con filtros
                                               Exportar Excel / PDF
/evaluaciones/nueva?cursoId=  →  Crear evaluación (curso pre-seleccionado)
/calificar  →  Calificar submissions
/perfil     →  Editar perfil
```

### Coordinador

```
/dashboard  →  Métricas globales + accesos rápidos
/usuarios   →  CRUD de usuarios (estudiantes y maestros)
/cursos     →  CRUD de cursos + gestión de matrículas
/pqrs       →  Gestión centralizada (solo lectura/respuesta, no puede crear)
/reportes   →  Reportes consolidados
/perfil     →  Editar perfil
```

### Tabla de permisos

| Funcionalidad | Estudiante | Maestro | Coordinador |
|---|:---:|:---:|:---:|
| Realizar evaluaciones | ✅ | — | — |
| Ver calificaciones propias | ✅ | — | — |
| Crear evaluaciones | — | ✅ | — |
| Calificar submissions | — | ✅ | — |
| Exportar reportes (Excel/PDF) | — | ✅ | ✅ |
| Crear PQRS | ✅ | — | — |
| Responder PQRS | — | ✅ | ✅ |
| Gestionar usuarios | — | — | ✅ |
| Gestionar cursos | — | — | ✅ |

---

## 🔌 Integración con el backend

El frontend consume una API REST Spring Boot. La URL base se configura en `VITE_API_BASE_URL`.

### Endpoints consumidos

#### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login → devuelve `{ token, user }` |
| `POST` | `/auth/register` | Registro de usuario |

#### Cursos
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/cursos` | Todos los cursos |
| `GET` | `/cursos/:id` | Curso por ID |
| `GET` | `/cursos/profesor/:id` | Cursos de un profesor |
| `POST` | `/cursos` | Crear curso |
| `PUT` | `/cursos/:id` | Actualizar curso |
| `DELETE` | `/cursos/:id` | Eliminar curso |
| `GET` | `/cursos/:id/estudiantes` | Estudiantes matriculados |
| `POST` | `/cursos/:id/estudiantes` | Matricular estudiante |
| `DELETE` | `/cursos/:id/estudiantes/:estudianteId` | Desmatricular |

#### Evaluaciones
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/evaluaciones` | Listar (acepta filtros: `cursoId`, `estado`, `tipo`) |
| `GET` | `/evaluaciones/:id` | Evaluación por ID |
| `GET` | `/evaluaciones/curso/:id` | Evaluaciones de un curso |
| `POST` | `/evaluaciones` | Crear evaluación |
| `PUT` | `/evaluaciones/:id` | Actualizar |
| `DELETE` | `/evaluaciones/:id` | Eliminar |

#### Submissions, Calificaciones, Resultados, PQRS, Usuarios
Ver los archivos en `src/services/` — cada servicio documenta sus endpoints con tipos TypeScript completos.

### Formato de respuesta esperado

```typescript
// Todas las respuestas siguen esta estructura
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

### CORS

El backend debe permitir el origen del frontend:

```yaml
# application.yml (Spring Boot)
spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173"
      allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
      allowed-headers: "*"
```

---

## 🎨 Decisiones de diseño

### Por qué drill-down por curso

Las vistas globales (listas de todas las evaluaciones de todos los cursos) generan confusión cuando un usuario gestiona múltiples materias. El patrón drill-down — seleccionar primero el curso, luego operar dentro de ese contexto — reduce errores y mejora la velocidad de navegación.

### Exportación de reportes sin dependencias de servidor

Los reportes Excel y PDF se generan completamente en el cliente con SheetJS y jsPDF. Esto evita endpoints adicionales en el backend y permite exportar incluso con filtros aplicados en la UI.

### Interceptor de errores centralizado

Todos los errores HTTP pasan por el interceptor en `api.ts`. Esto garantiza que el toast de error aparezca una sola vez por petición fallida, sin que cada componente tenga que manejar el caso de error de red.

### Tokens en localStorage vs cookies

Se usa `localStorage` por simplicidad de integración con el backend Spring Boot actual. Para producción con requisitos de seguridad más estrictos, se recomienda migrar a `httpOnly cookies`.

---

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama descriptiva: `git checkout -b feat/nombre-feature`
3. Sigue las convenciones existentes (componentes funcionales, TypeScript estricto, Tailwind para estilos)
4. Asegúrate de que `npm run build` pase sin errores antes de abrir un PR
5. Abre el Pull Request con una descripción clara del cambio y su motivación

### Convenciones de commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: cambio de código sin cambio de comportamiento
style:    cambios de formato/estilos
docs:     cambios en documentación
```

---

## 📄 Licencia

MIT © Equipo QuimbayaEVAL — SENA Centro de Formación Quimbaya

---

<div align="center">
<sub>Documentación adicional en <a href="./docs/">/docs</a></sub>
</div>
