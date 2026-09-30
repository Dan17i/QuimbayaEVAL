# Etapa 1: Build de la aplicación con Node 20
FROM node:20-alpine AS build

WORKDIR /app

# Copiar descriptores de dependencias para aprovechar caché de capas Docker
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Argumento para la URL base de API (por defecto relativa a través de Nginx)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Compilar para producción
RUN npm run build

# Etapa 2: Servidor web de producción Nginx ligero
FROM nginx:alpine

# Copiar bundle compilado al directorio web de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración con proxy reverso y SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
