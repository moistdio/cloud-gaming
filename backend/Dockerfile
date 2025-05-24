FROM node:18-slim

WORKDIR /app

# Install OpenSSL and Docker CLI
RUN apt-get update -y && \
    apt-get install -y openssl curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

ENV PORT=7200
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@db:7400/cloudgaming"

EXPOSE 7200

# Create a startup script
COPY <<EOF /app/start.sh
#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 7400; do
  sleep 1
done

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
npx prisma db push --accept-data-loss

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm start
EOF

RUN chmod +x /app/start.sh
RUN apt-get update && apt-get install -y netcat-openbsd

CMD ["/app/start.sh"] 