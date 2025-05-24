# Cloud Gaming Platform

A self-hosted cloud gaming platform that allows users to manage their own Linux Steam instances and connect via Moonlight. Similar to GeForce Now, but self-hosted.

## Features

- User registration with invite-only system
- Secure authentication and session management
- Personal Linux Steam instance management
- Moonlight streaming support
- Persistent storage for game data
- Docker containerization

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Streaming**: Sunshine (pre-installed), Moonlight
- **Infrastructure**: Linux with GPU support

## Project Structure

```
.
├── frontend/               # Next.js frontend application
├── backend/               # Express backend server
├── docker/                # Docker configuration files
├── scripts/               # Utility scripts
└── docker-compose.yml     # Docker compose configuration
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- GPU-enabled Linux server with Sunshine installed
- PostgreSQL database

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables
3. Run `docker-compose up` to start all services
4. Access the web interface at `http://localhost:3000`

## Development

1. Frontend development:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Backend development:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Docker Deployment

```bash
docker-compose up -d
```

## License

MIT License 