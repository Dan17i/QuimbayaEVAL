# 🤝 Guía de Contribución - QuimbayaEVAL

¡Gracias por tu interés en contribuir a QuimbayaEVAL! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Mejoras](#sugerir-mejoras)

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código. Por favor reporta comportamientos inaceptables.

### Nuestros Estándares

- Usar lenguaje acogedor e inclusivo
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas con gracia
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

## 🎯 ¿Cómo puedo contribuir?

### Reportar Bugs

Los bugs se rastrean como issues de GitHub. Antes de crear un issue:

1. **Verifica** que el bug no haya sido reportado ya
2. **Determina** en qué repositorio debería ir el issue
3. **Recopila** información sobre el bug

#### Cómo escribir un buen reporte de bug

- **Usa un título claro y descriptivo**
- **Describe los pasos exactos** para reproducir el problema
- **Proporciona ejemplos específicos**
- **Describe el comportamiento observado** y explica qué esperabas ver
- **Incluye screenshots** si es posible
- **Incluye detalles del entorno**: OS, navegador, versión

### Sugerir Mejoras

Las mejoras también se rastrean como issues. Antes de crear una sugerencia:

1. **Verifica** que la mejora no haya sido sugerida ya
2. **Determina** si tu idea encaja con el alcance del proyecto

#### Cómo escribir una buena sugerencia

- **Usa un título claro y descriptivo**
- **Proporciona una descripción detallada** de la mejora sugerida
- **Proporciona ejemplos específicos** de cómo funcionaría
- **Describe el comportamiento actual** y explica por qué es insuficiente
- **Explica por qué esta mejora sería útil**

### Tu Primera Contribución de Código

¿No estás seguro por dónde empezar? Puedes comenzar buscando issues etiquetados como:

- `good first issue` - Issues que deberían requerir solo unas pocas líneas de código
- `help wanted` - Issues que pueden ser más complejos

## 🛠️ Configuración del Entorno

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Pasos

1. **Fork el repositorio**

2. **Clona tu fork**

```bash
git clone https://github.com/TU-USUARIO/quimbayaeval-front.git
cd quimbayaeval-front
```

3. **Agrega el repositorio original como upstream**

```bash
git remote add upstream https://github.com/USUARIO-ORIGINAL/quimbayaeval-front.git
```

4. **Instala las dependencias**

```bash
npm install
```

5. **Crea una rama para tu feature**

```bash
git checkout -b feature/mi-nueva-feature
```

6. **Configura las variables de entorno**

```bash
cp .env.example .env.local
```

7. **Inicia el servidor de desarrollo**

```bash
npm run dev
```

## 🔄 Proceso de Desarrollo

### Workflow

1. **Sincroniza tu fork** con el repositorio upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Crea una rama** para tu feature/fix

```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/nombre-del-bug
```

3. **Haz tus cambios** siguiendo los estándares de código

4. **Ejecuta los tests**

```bash
npm test
```

5. **Ejecuta el linter**

```bash
npm run lint
```

6. **Commit tus cambios** siguiendo las convenciones

7. **Push a tu fork**

```bash
git push origin feature/nombre-descriptivo
```

8. **Abre un Pull Request**

## 📝 Estándares de Código

### TypeScript

- Usa TypeScript para todo el código nuevo
- Define interfaces para props y tipos de datos
- Evita usar `any`, usa tipos específicos

```typescript
// ✅ Correcto
interface UserProps {
  name: string;
  email: string;
  role: 'estudiante' | 'maestro' | 'coordinador';
}

// ❌ Incorrecto
interface UserProps {
  name: any;
  email: any;
  role: any;
}
```

### React

- Usa componentes funcionales con hooks
- Usa nombres descriptivos para componentes y funciones
- Mantén los componentes pequeños y enfocados
- Usa PropTypes o TypeScript para validación de props

```typescript
// ✅ Correcto
export const UserCard: React.FC<UserProps> = ({ name, email, role }) => {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{email}</p>
      <Badge>{role}</Badge>
    </div>
  );
};

// ❌ Incorrecto
export const Card = (props) => {
  return <div>{props.data}</div>;
};
```

### Estilos

- Usa Tailwind CSS utility classes
- Evita CSS inline
- Usa componentes de Shadcn/ui cuando sea posible
- Mantén consistencia en espaciado (sistema 4px)

```typescript
// ✅ Correcto
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-md">
  <Icon className="w-6 h-6 text-blue-600" />
  <span className="text-gray-900">Contenido</span>
</div>

// ❌ Incorrecto
<div style={{ display: 'flex', padding: '15px' }}>
  <span>Contenido</span>
</div>
```

### Naming Conventions

- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
- **Utilidades**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tipos/Interfaces**: PascalCase (`UserRole`)

### Estructura de Archivos

```typescript
// Orden de imports
import React from 'react'; // React primero
import { useState } from 'react'; // Hooks de React

import { useNavigate } from 'react-router-dom'; // Librerías externas

import { Button } from '@/components/ui/button'; // Componentes UI
import { useAuth } from '@/hooks/useAuth'; // Hooks personalizados
import { formatDate } from '@/utils/date'; // Utilidades

import type { User } from '@/types'; // Tipos

// Componente
export const MyComponent: React.FC = () => {
  // ...
};
```

## 💬 Commits

### Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit:

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

#### Tipos

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan el código)
- `refactor`: Refactorización de código
- `perf`: Mejoras de performance
- `test`: Agregar o modificar tests
- `chore`: Cambios en build, dependencias, etc.

#### Ejemplos

```bash
feat(auth): agregar login con Google
fix(evaluaciones): corregir cálculo de calificaciones
docs(readme): actualizar instrucciones de instalación
style(button): ajustar padding y colores
refactor(hooks): simplificar lógica de useCursos
perf(dashboard): optimizar carga de estadísticas
test(auth): agregar tests para AuthContext
chore(deps): actualizar dependencias
```

## 🔀 Pull Requests

### Antes de Crear un PR

- [ ] El código sigue los estándares del proyecto
- [ ] Has ejecutado los tests y todos pasan
- [ ] Has ejecutado el linter sin errores
- [ ] Has actualizado la documentación si es necesario
- [ ] Has agregado tests para nuevas funcionalidades
- [ ] El PR resuelve un issue existente (referéncialo)

### Cómo Crear un Buen PR

1. **Título claro y descriptivo**

```
feat(evaluaciones): agregar filtro por fecha
```

2. **Descripción detallada**

```markdown
## Descripción
Agrega un filtro de fecha en la página de evaluaciones para permitir a los maestros filtrar por rango de fechas.

## Cambios
- Agrega componente DateRangePicker
- Actualiza EvaluacionesPage con nuevo filtro
- Agrega tests para el filtro

## Screenshots
[Incluir capturas de pantalla si aplica]

## Checklist
- [x] Tests agregados/actualizados
- [x] Documentación actualizada
- [x] Linter pasa sin errores
- [x] Tests pasan

## Issues Relacionados
Closes #123
```

3. **Mantén el PR enfocado**
   - Un PR = Una funcionalidad/fix
   - Evita cambios no relacionados
   - Mantén los cambios pequeños y revisables

4. **Responde a los comentarios**
   - Responde a todos los comentarios de revisión
   - Haz los cambios solicitados
   - Marca las conversaciones como resueltas

## 🐛 Reportar Bugs

### Template de Issue para Bugs

```markdown
**Descripción del Bug**
Una descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ve a '...'
2. Haz click en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado**
Una descripción clara de lo que esperabas que sucediera.

**Comportamiento Actual**
Una descripción clara de lo que sucede actualmente.

**Screenshots**
Si aplica, agrega screenshots para ayudar a explicar el problema.

**Entorno**
- OS: [e.g. Windows 11]
- Navegador: [e.g. Chrome 120]
- Versión: [e.g. 1.0.0]

**Contexto Adicional**
Agrega cualquier otro contexto sobre el problema aquí.
```

## 💡 Sugerir Mejoras

### Template de Issue para Mejoras

```markdown
**¿Tu sugerencia está relacionada con un problema?**
Una descripción clara y concisa del problema. Ej: Siempre me frustra cuando [...]

**Describe la solución que te gustaría**
Una descripción clara y concisa de lo que quieres que suceda.

**Describe alternativas que has considerado**
Una descripción clara y concisa de cualquier solución o funcionalidad alternativa que hayas considerado.

**Contexto Adicional**
Agrega cualquier otro contexto o screenshots sobre la sugerencia aquí.
```

## 📚 Recursos Adicionales

- [Documentación de React](https://react.dev/)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [Guía de Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Preguntas

Si tienes preguntas, puedes:

- Abrir un issue con la etiqueta `question`
- Unirte a nuestras discusiones en GitHub
- Contactar al equipo de desarrollo

## 🙏 Agradecimientos

¡Gracias por contribuir a QuimbayaEVAL! Tu ayuda hace que este proyecto sea mejor para todos.

---

**¿Listo para contribuir?** ¡Empieza buscando un [good first issue](https://github.com/tu-usuario/quimbayaeval-front/labels/good%20first%20issue)!
