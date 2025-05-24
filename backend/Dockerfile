FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

ENV PORT=7200
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@db:7400/cloudgaming"

EXPOSE 7200

# Run migrations and start the application
CMD npx prisma migrate deploy && npm start 