# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren (npm ci falls lock file existiert, sonst npm install)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm cache clean --force

# Source code kopieren
COPY . .

# App bauen
RUN npm run build

# Production stage
FROM nginx:alpine

# Nginx-Konfiguration kopieren
COPY nginx.conf /etc/nginx/nginx.conf

# Built app kopieren
COPY --from=build /app/dist /usr/share/nginx/html

# Port freigeben
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Nginx starten
CMD ["nginx", "-g", "daemon off;"] 