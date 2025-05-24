FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

ENV PORT=7200
ENV NODE_ENV=production

EXPOSE 7200

CMD ["npm", "start"] 