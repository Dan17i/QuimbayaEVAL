# 🐳 Guía de Despliegue con Docker y Docker Compose

Este documento describe cómo levantar la plataforma completa **QuimbayaEVAL** (Frontend, Backend y Base de Datos PostgreSQL) en contenedores utilizando Docker Compose.

---

## 🏗️ Arquitectura de Contenedores

| Servicio | Contenedor | Puerto Host | Descripción |
| :--- | :--- | :--- | :--- |
| **`frontend`** | `quimbayaeval-front` | `3000` | Servidor Nginx con build de React + Vite y reverse proxy para `/api` |
| **`backend`** | `quimbayaeval-backend` | `8080` | Spring Boot 3 ejecutándose sobre OpenJDK 17 |
| **`postgres`** | `quimbayaeval-db` | `5433` | PostgreSQL 15 Alpine con volumen de datos persistente |

---

## 🚀 Comandos Rápidos

### 1. Construir y Levantar Todo
Desde la carpeta raíz del proyecto (`bases SENA/`):

```bash
docker compose up -d --build
```

### 2. Verificar Estado de los Servicios
```bash
docker compose ps
```

### 3. Consultar Logs en Tiempo Real
```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs solo del backend
docker compose logs -f backend

# Ver logs solo del frontend
docker compose logs -f frontend
```

### 4. Acceder a la Aplicación
* **Frontend Web:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
* **PostgreSQL:** `localhost:5433` (Usuario: `postgres`, Password: `postgres`, DB: `quimbayaeval`)

### 5. Detener los Servicios
```bash
# Detener sin borrar datos
docker compose down

# Detener eliminando volúmenes (reinicio limpio de BD)
docker compose down -v
```
