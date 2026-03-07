# 🔧 Troubleshooting - Solución de Problemas

## ❌ Error: "Error al iniciar sesión - Por favor intenta nuevamente"

### Síntomas
- Aparece un mensaje de error al intentar hacer login
- El mensaje dice "Error al iniciar sesión"
- No se puede acceder al sistema

### Causas Comunes

#### 1. Backend No Está Corriendo

**Solución:**
```bash
# Navegar al directorio del backend
cd backend

# Iniciar el backend
mvn spring-boot:run
```

**Verificar:**
- Abre http://localhost:8080 en tu navegador
- Deberías ver una respuesta del servidor
- Revisa la consola del backend para ver si hay errores

#### 2. Puerto Incorrecto

**Verificar configuración:**
```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

**Si tu backend usa otro puerto:**
```env
VITE_API_BASE_URL=http://localhost:PUERTO/api
```

#### 3. Credenciales Incorrectas

**Credenciales de prueba:**
- Estudiante: `estudiante@universidad.edu` / `password123`
- Maestro: `maestro@universidad.edu` / `password123`

**Verificar en el backend:**
- Revisa que estos usuarios existan en la base de datos
- Verifica que las contraseñas sean correctas

#### 4. Error de CORS

**Síntomas:**
- Error en la consola del navegador: "CORS policy"
- El backend rechaza la petición

**Solución:**

Verifica la configuración CORS en el backend:

```yaml
# application.yml
cors:
  allowed-origins: http://localhost:5173,http://localhost:3000
```

Si usas otro puerto en el frontend, agrégalo a la lista.

#### 5. Base de Datos No Configurada

**Síntomas:**
- Backend inicia pero falla al hacer login
- Errores de conexión a base de datos en logs

**Solución:**

Verifica la configuración de la base de datos:

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/quimbayaeval
    username: root
    password: tu_password
```

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar Backend

```bash
# Iniciar backend
cd backend
mvn spring-boot:run
```

**Esperar a ver:**
```
Started QuimbayaEvalApplication in X.XXX seconds
```

### Paso 2: Verificar Endpoint de Login

Abre una terminal y ejecuta:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@universidad.edu","password":"password123","role":"estudiante"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGc...",
    "id": 1,
    "name": "Nombre Usuario",
    "email": "estudiante@universidad.edu",
    "role": "estudiante"
  }
}
```

### Paso 3: Verificar Frontend

```bash
# Iniciar frontend
npm run dev
```

**Abrir:** http://localhost:5173

### Paso 4: Revisar Consola del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Intenta hacer login
4. Busca errores en rojo

**Errores comunes:**

```
❌ Network Error
→ Backend no está corriendo

❌ 401 Unauthorized
→ Credenciales incorrectas

❌ CORS policy
→ Configuración CORS incorrecta

❌ 404 Not Found
→ URL del API incorrecta
```

## 🛠️ Soluciones Específicas

### Error: "Network Error"

**Causa:** No se puede conectar con el backend

**Solución:**
1. Verifica que el backend esté corriendo
2. Verifica la URL en `.env.local`
3. Verifica que no haya firewall bloqueando

```bash
# Verificar si el puerto está en uso
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux
```

### Error: "401 Unauthorized"

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica las credenciales de prueba
2. Verifica que el usuario exista en la base de datos
3. Verifica que la contraseña sea correcta

```sql
-- Verificar usuarios en la base de datos
SELECT * FROM usuarios WHERE email = 'estudiante@universidad.edu';
```

### Error: "CORS policy"

**Causa:** Backend no permite peticiones desde el frontend

**Solución:**

Edita `application.yml`:

```yaml
cors:
  allowed-origins: http://localhost:5173
```

Reinicia el backend después de cambiar la configuración.

### Error: "Cannot read properties of undefined"

**Causa:** Respuesta del backend no tiene el formato esperado

**Solución:**

Verifica que el backend devuelva:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

## 📋 Checklist de Verificación

### Backend
- [ ] Backend está corriendo en puerto 8080
- [ ] Base de datos está configurada y corriendo
- [ ] Usuarios de prueba existen en la base de datos
- [ ] CORS está configurado correctamente
- [ ] No hay errores en los logs del backend

### Frontend
- [ ] Frontend está corriendo en puerto 5173
- [ ] `.env.local` tiene la URL correcta del API
- [ ] No hay errores en la consola del navegador
- [ ] Axios está instalado (`npm install axios`)

### Credenciales
- [ ] Email es válido (formato correcto)
- [ ] Contraseña tiene al menos 3 caracteres
- [ ] Usuario existe en la base de datos
- [ ] Rol es correcto (estudiante/maestro/coordinador)

## 🔄 Reiniciar Todo

Si nada funciona, reinicia todo:

```bash
# 1. Detener todo
# Ctrl+C en todas las terminales

# 2. Limpiar backend
cd backend
mvn clean

# 3. Reinstalar dependencias frontend
cd ..
rm -rf node_modules
npm install

# 4. Iniciar backend
cd backend
mvn spring-boot:run

# 5. En otra terminal, iniciar frontend
npm run dev
```

## 📞 Obtener Más Información

### Ver Logs del Backend

Los logs del backend aparecen en la terminal donde ejecutaste `mvn spring-boot:run`.

Busca líneas como:
```
ERROR: ...
WARN: ...
```

### Ver Logs del Frontend

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Ve a la pestaña "Network"
4. Filtra por "XHR" o "Fetch"
5. Haz click en la petición fallida
6. Ve a "Response" para ver la respuesta del servidor

### Habilitar Logs Detallados

En `src/services/api.ts`, agrega:

```typescript
api.interceptors.request.use((config) => {
  console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
  console.log('📦 Data:', config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

## 🎯 Solución Rápida

Si solo quieres probar que todo funciona:

1. **Inicia el backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Espera a que inicie completamente**

3. **En otra terminal, inicia el frontend:**
   ```bash
   npm run dev
   ```

4. **Abre http://localhost:5173**

5. **Usa estas credenciales:**
   - Email: `estudiante@universidad.edu`
   - Password: `password123`
   - Rol: Estudiante

## 📚 Recursos Adicionales

- [QUICK_START.md](./QUICK_START.md) - Guía de inicio rápido
- [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) - Documentación de integración
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Mejores prácticas implementadas

## 💡 Tips

1. **Siempre inicia el backend primero**
2. **Verifica que el backend esté completamente iniciado antes de probar el frontend**
3. **Revisa la consola del navegador para errores**
4. **Revisa los logs del backend para errores del servidor**
5. **Usa las credenciales de prueba proporcionadas**

## ⚠️ Errores Conocidos

### "Cannot find module 'axios'"

**Solución:**
```bash
npm install axios
```

### "Port 8080 is already in use"

**Solución:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

### "Port 5173 is already in use"

**Solución:**
```bash
# Detener el proceso
# Ctrl+C en la terminal

# O cambiar el puerto en vite.config.ts
export default defineConfig({
  server: {
    port: 3000
  }
});
```
