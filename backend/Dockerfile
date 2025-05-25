FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren (npm ci falls lock file existiert, sonst npm install)
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && npm cache clean --force

# App-Code kopieren
COPY . .

# Datenverzeichnis erstellen
RUN mkdir -p /app/data

# Port freigeben
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# App starten
CMD ["npm", "start"] 