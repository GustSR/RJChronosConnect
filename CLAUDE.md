# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RJChronosConnect is a network equipment management and monitoring platform for TR-069 devices (CPEs, ONUs) using GenieACS as the auto-configuration server (ACS). The system provides a modern web interface for real-time diagnostics, remote configuration, and alert management.

## Architecture

The platform uses a microservices architecture with Docker containerization:

- **Frontend**: React application with Vite, TypeScript, Material-UI, and React Router
- **Backend**: FastAPI (Python) API serving as the core system
- **GenieACS**: TR-069 auto-configuration server for device communication
- **Databases**: PostgreSQL (application data) and MongoDB (GenieACS data)
- **Additional Services**: Nginx reverse proxy, Redis caching

## Development Commands

### Environment Setup
```bash
# Start development environment (with live reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Start production environment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### Frontend (React + Vite)
```bash
# Development server (inside container or locally)
npm run dev

# Build for production
npm run build

# Type checking
npm run check

# Linting
npm run lint

# Testing
npm test
npm run test:ui
npm run coverage
```

### Backend (FastAPI)
The backend uses FastAPI with the following structure:
- `services/backend-api/app/main.py`: Main FastAPI application
- `services/backend-api/app/services/`: Service layer (GenieACS client, transformers)

Key dependencies: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis, Celery

## Service Access Points

- **Main Application**: http://localhost:8081
- **Backend API**: http://localhost:8081/api
- **GenieACS UI**: http://localhost:8081/ui
- **GenieACS MCP Panel**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **GenieACS TR-069**: localhost:7547
- **GenieACS API**: localhost:7557

## Docker Services

All services run in the `rjchronos-net` network:

- `frontend`: React app (port 8081 via nginx)
- `backend`: FastAPI app (internal)
- `genieacs`: TR-069 server (ports 7547, 7557, 7567, 3001)
- `reverse-proxy`: Nginx (port 8081)
- `db-app`: PostgreSQL (port 5432)
- `db-acs`: MongoDB (internal)
- `redis`: Redis cache (internal)

## Key Integration Points

- **GenieACS Integration**: Backend communicates with GenieACS via HTTP API at `http://genieacs:7557/`
- **Device Transformation**: The `genieacs_transformers.py` module handles conversion between GenieACS data format and application models
- **TR-069 Communication**: GenieACS handles all TR-069 protocol communication with network devices

## Environment Variables

Create `.env` file from `.env.example` with:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials
- `UI_JWT_SECRET`: GenieACS UI authentication secret

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs different tests based on branch:
- `dev` branch: Tests development environment
- `main` branch: Tests production environment with healthchecks

The workflow uses `docker compose` commands to build and verify services are running correctly.