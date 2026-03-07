# 📚 QuimbayaEVAL - Sistema de Gestión de Evaluaciones Académicas

<div align="center">

![QuimbayaEVAL](https://img.shields.io/badge/QuimbayaEVAL-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

**Sistema web moderno para la gestión integral de evaluaciones académicas**

[Características](#-características) • [Instalación](#-instalación-rápida) • [Documentación](#-documentación) • [Tecnologías](#-tecnologías)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación Rápida](#-instalación-rápida)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roles y Permisos](#-roles-y-permisos)
- [Documentación](#-documentación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Configuración](#-configuración)
- [Integración con Backend](#-integración-con-backend)
- [Mejores Prácticas](#-mejores-prácticas)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**QuimbayaEVAL** es una plataforma web completa diseñada para facilitar la gestión de evaluaciones académicas en instituciones educativas. Permite a estudiantes, maestros y coordinadores interactuar de manera eficiente con el sistema de evaluaciones, desde la creación hasta la calificación y análisis de resultados.

### ¿Por qué QuimbayaEVAL?

- ✅ **Interfaz moderna y responsive** - Diseñada con los últimos estándares web
- ✅ **Accesibilidad WCAG 2.1 AA** - Inclusiva para todos los usuarios
- ✅ **Gestión por roles** - Permisos específicos para cada tipo de usuario
- ✅ **Sistema PQRS integrado** - Canal de comunicación directo
- ✅ **Reportes y estadísticas** - Análisis detallado del desempeño
- ✅ **Tiempo real** - Actualizaciones instantáneas de datos

---

## ✨ Características

### Para Estudiantes 👨‍🎓

- 📝 Realizar evaluaciones en línea con timer
- 📊 Ver calificaciones y feedback detallado
- 📈 Seguimiento de progreso por curso
- 📅 Calendario de evaluaciones pendientes
- 💬 Sistema PQRS para consultas y reclamos

### Para Maestros 👨‍🏫

- ➕ Crear y gestionar evaluaciones
- ✏️ Múltiples tipos de preguntas (selección múltiple, V/F, respuesta corta, ensayo)
- 📋 Calificar evaluaciones con rúbricas
- 📊 Generar reportes de desempeño
- 👥 Gestión de estudiantes por curso
- 💬 Responder PQRS de estudiantes

### Para Coordinadores 👨‍💼

- 🏢 Vista global del sistema
- 👥 Gestión de usuarios (estudiantes y maestros)
- 📊 Reportes consolidados
- 🔧 Configuración del sistema
- 💬 Gestión centralizada de PQRS

### Características Técnicas

- 🎨 **UI/UX moderna** con Shadcn/ui y Tailwind CSS
- 🔐 **Autenticación segura** con JWT
- 📱 **Responsive design** - Funciona en móviles, tablets y desktop
- ⚡ **Performance optimizada** con lazy loading y code splitting
- 🌐 **Internacionalización** preparada
- ♿ **Accesibilidad completa** con ARIA labels y navegación por teclado
- 🔄 **Estados de carga** y feedback visual en todas las operaciones
- 🎯 **Validación de formularios** en tiempo real

---

## 🛠️ Tecnologías

### Core

- **[React 18](https://react.dev/)** - Biblioteca de UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Vite](https://vitejs.dev/)** - Build tool y dev server
- **[React Router v6](https://reactrouter.com/)** - Enrutamiento

### UI/Styling

- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de estilos
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes de UI
- **[Radix UI](https://www.radix-ui.com/)** - Primitivas accesibles
- **[Lucide React](https://lucide.dev/)** - Iconos

### Gestión de Estado y Formularios

- **[React Hook Form](https://react-hook-form.com/)** - Gestión de formularios
- **[Zod](https://zod.dev/)** - Validación de schemas
- **Context API** - Estado global

### HTTP y Comunicación

- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[Sonner](https://sonner.emilkowal.ski/)** - Notificaciones toast

### Desarrollo

- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Formateo de código

---

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0 o yarn >= 1.22.0
- Backend QuimbayaEVAL corriendo en `http://localhost:8080`

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/quimbayaeval-front.git
cd quimbayaeval-front
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus configuraciones:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=QuimbayaEVAL
VITE_ENABLE_MOCK_DATA=false
```

4. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

5. **Abrir en el navegador**

```
http://localhost:5173
```

### Credenciales de Prueba

**Estudiante:**
- Email: `estudiante@universidad.edu`
- Password: `password123`

**Maestro:**
- Email: `maestro@universidad.edu`
- Password: `password123`

**Coordinador:**
- Email: `coordinador@universidad.edu`
- Password: `password123`

---

## 📁 Estructura del Proyecto

```
quimbayaeval-front/
├── src/
│   ├── pages/              # Páginas/Vistas por rol
│   │   ├── LoginPage.tsx
│   │   ├── DashboardEstudiante.tsx
│   │   ├── DashboardMaestro.tsx
│   │   ├── DashboardCoordinador.tsx
│   │   ├── EvaluacionesPage.tsx
│   │   ├── CrearEvaluacionPage.tsx
│   │   ├── CalificarPage.tsx
│   │   ├── RealizarEvaluacionPage.tsx
│   │   ├── PQRSPage.tsx
│   │   └── ...
│   │
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes base Shadcn/ui
│   │   ├── Layout.tsx     # Layout principal
│   │   ├── ProtectedRoute.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ...
│   │
│   ├── services/          # Servicios y API
│   │   ├── api.ts         # Cliente HTTP configurado
│   │   ├── authService.ts
│   │   ├── cursosService.ts
│   │   ├── evaluacionesService.ts
│   │   ├── pqrsService.ts
│   │   └── ...
│   │
│   ├── hooks/             # Hooks personalizados
│   │   ├── useCursos.ts
│   │   ├── useEvaluaciones.ts
│   │   ├── usePQRS.ts
│   │   └── useAuth.ts
│   │
│   ├── contexts/          # Contextos React
│   │   └── AuthContext.tsx
│   │
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts
│   │
│   ├── constants/         # Constantes
│   │   ├── routes.ts
│   │   └── roles.ts
│   │
│   ├── utils/             # Utilidades
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── debounce.ts
│   │
│   ├── styles/            # Estilos globales
│   │   └── globals.css
│   │
│   ├── App.tsx            # Componente raíz
│   └── main.tsx           # Punto de entrada
│
├── public/                # Archivos estáticos
├── docs/                  # Documentación
│   ├── BACKEND_CONNECTION.md
│   ├── BEST_PRACTICES.md
│   ├── TROUBLESHOOTING.md
│   └── ...
│
├── .env.example           # Ejemplo de variables de entorno
├── .env.local             # Variables de entorno (no versionado)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 👥 Roles y Permisos

### Estudiante

| Funcionalidad | Acceso |
|--------------|--------|
| Ver evaluaciones pendientes | ✅ |
| Realizar evaluaciones | ✅ |
| Ver calificaciones | ✅ |
| Ver historial | ✅ |
| Crear PQRS | ✅ |
| Crear evaluaciones | ❌ |
| Calificar | ❌ |
| Gestionar usuarios | ❌ |

### Maestro

| Funcionalidad | Acceso |
|--------------|--------|
| Crear evaluaciones | ✅ |
| Editar evaluaciones | ✅ |
| Calificar evaluaciones | ✅ |
| Ver reportes | ✅ |
| Responder PQRS | ✅ |
| Gestionar usuarios | ❌ |

### Coordinador

| Funcionalidad | Acceso |
|--------------|--------|
| Vista global del sistema | ✅ |
| Gestionar usuarios | ✅ |
| Ver todos los reportes | ✅ |
| Gestionar PQRS | ✅ |
| Configuración del sistema | ✅ |

---

## 📚 Documentación

### Documentación Disponible

- **[QUICK_START.md](./QUICK_START.md)** - Guía de inicio rápido
- **[BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md)** - Integración con backend
- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Mejores prácticas implementadas
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solución de problemas
- **[MEJORAS_APLICADAS.md](./MEJORAS_APLICADAS.md)** - Resumen de mejoras
- **[INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)** - Checklist de integración
- **[src/examples/EjemploUsoServicios.tsx](./src/examples/EjemploUsoServicios.tsx)** - Ejemplos de código

### Documentación del API

Consulta [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) para la documentación completa del API REST.

---

## 📜 Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Iniciar con puerto específico
npm run dev -- --port 3000
```

### Build

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

### Linting y Formateo

```bash
# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

### Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=QuimbayaEVAL
VITE_APP_VERSION=1.0.0

# Auth Configuration
VITE_AUTH_TOKEN_KEY=quimbayaeval_token
VITE_AUTH_USER_KEY=quimbayaeval_user

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEV_TOOLS=true
```

### Configuración de Tailwind

Personaliza los colores y estilos en `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ...
          900: '#1e3a8a',
        },
      },
    },
  },
};
```

---

## 🔌 Integración con Backend

### Requisitos del Backend

El frontend espera que el backend implemente los siguientes endpoints:

#### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

#### Cursos

- `GET /api/cursos` - Listar cursos
- `GET /api/cursos/{id}` - Obtener curso
- `POST /api/cursos` - Crear curso
- `PUT /api/cursos/{id}` - Actualizar curso
- `DELETE /api/cursos/{id}` - Eliminar curso

#### Evaluaciones

- `GET /api/evaluaciones` - Listar evaluaciones (con filtros)
- `GET /api/evaluaciones/{id}` - Obtener evaluación
- `POST /api/evaluaciones` - Crear evaluación
- `PUT /api/evaluaciones/{id}` - Actualizar evaluación
- `DELETE /api/evaluaciones/{id}` - Eliminar evaluación

#### PQRS

- `GET /api/pqrs` - Listar PQRS
- `GET /api/pqrs/mis-pqrs` - Mis PQRS
- `POST /api/pqrs` - Crear PQRS
- `PUT /api/pqrs/{id}/responder` - Responder PQRS

Ver [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) para la documentación completa.

### Configuración CORS

El backend debe permitir peticiones desde:

```yaml
cors:
  allowed-origins: http://localhost:5173,http://localhost:3000
```

---

## 🎨 Mejores Prácticas

### Código

- ✅ Componentes funcionales con hooks
- ✅ TypeScript para tipado estático
- ✅ Props interfaces bien definidas
- ✅ Manejo de errores con try-catch
- ✅ Estados de carga en todas las operaciones
- ✅ Validación de formularios con react-hook-form
- ✅ Optimización con useMemo y useCallback

### Estilos

- ✅ Tailwind CSS utility-first
- ✅ Componentes reutilizables de Shadcn/ui
- ✅ Responsive design mobile-first
- ✅ Variables CSS para temas
- ✅ Consistencia en espaciado (sistema 4px)

### Accesibilidad

- ✅ ARIA labels en elementos interactivos
- ✅ Navegación por teclado completa
- ✅ Contraste de colores WCAG AA
- ✅ Roles semánticos en HTML
- ✅ Mensajes de error descriptivos

### Performance

- ✅ Lazy loading de rutas
- ✅ Code splitting automático
- ✅ Memoización de cálculos costosos
- ✅ Debounce en búsquedas
- ✅ Optimización de imágenes

Ver [BEST_PRACTICES.md](./BEST_PRACTICES.md) para más detalles.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código existentes
- Escribe tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Asegúrate de que el código pase el linter

---

## 🐛 Reportar Problemas

Si encuentras un bug o tienes una sugerencia:

1. Verifica que no exista un issue similar
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Información del entorno (OS, navegador, versión)

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autores

- **Equipo QuimbayaEVAL** - SENA Centro de Formación Quimbaya

---

## 🙏 Agradecimientos

- [Shadcn/ui](https://ui.shadcn.com/) por los componentes de UI
- [Radix UI](https://www.radix-ui.com/) por las primitivas accesibles
- [Tailwind CSS](https://tailwindcss.com/) por el framework de estilos
- [Lucide](https://lucide.dev/) por los iconos
- Comunidad de React y TypeScript

---

## 📞 Soporte

¿Necesitas ayuda? Consulta:

- 📖 [Documentación completa](./docs/)
- 🐛 [Issues en GitHub](https://github.com/tu-usuario/quimbayaeval-front/issues)
- 💬 [Discusiones](https://github.com/tu-usuario/quimbayaeval-front/discussions)

---

## 🗺️ Roadmap

### v1.1.0 (Próximo)
- [ ] Implementar refresh token
- [ ] Agregar tests E2E
- [ ] Modo oscuro
- [ ] Exportación de reportes a PDF

### v1.2.0
- [ ] Notificaciones en tiempo real
- [ ] Chat en vivo con soporte
- [ ] Integración con calendario
- [ ] App móvil nativa

### v2.0.0
- [ ] Inteligencia artificial para análisis
- [ ] Gamificación
- [ ] Integración con LMS externos
- [ ] API pública

---

<div align="center">

**Hecho con ❤️ por el equipo QuimbayaEVAL**

[⬆ Volver arriba](#-quimbayaeval---sistema-de-gestión-de-evaluaciones-académicas)

</div>
