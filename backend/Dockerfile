FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

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