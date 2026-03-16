# Analytics Hub

A self-hosted, modular analytics dashboard platform designed to replace Metabase. Build custom dashboards with a plugin-like architecture—easily add new dashboards for different data sources.

## Features

- **Plugin-based architecture**: Add new dashboards without modifying core code
- **Multi-database support**: Each dashboard connects to its own MySQL database with separate credentials
- **Modern stack**: FastAPI backend, React frontend, Docker deployment
- **Cohesive UI**: Shared components and styling across all dashboards
- **Easy setup**: Docker Compose brings up the entire stack with one command

## Quick Start

### Prerequisites

- Docker and Docker Compose
- MySQL instance with database credentials
- Python 3.10+ (for local development)
- Node.js 18+ (for local development)

### Setup

1. Clone the repository and navigate to it:
```bash
cd analytics-hub
```

2. Copy the environment example and configure your database credentials:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Start the application:
```bash
docker-compose up
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Architecture

### Project Structure

```
analytics-hub/
├── backend/
│   ├── app.py                      # FastAPI application
│   ├── config.py                   # Configuration & database setup
│   ├── dashboards/                 # Dashboard modules
│   │   ├── mortgage.py             # Mortgage rates dashboard
│   │   └── __init__.py
│   ├── queries/                    # Reusable SQL query functions
│   └── tests/                      # Unit tests
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Dashboard pages
│   │   ├── services/               # API client
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Database Configuration

Each dashboard connects to its own MySQL database with separate credentials. Configure via environment variables:

```bash
# Mortgage dashboard
DB_MORTGAGE_HOST=your-host
DB_MORTGAGE_USER=your-user
DB_MORTGAGE_PASSWORD=your-password
DB_MORTGAGE_NAME=your-database

# Future dashboards follow the same pattern
DB_SWIM_HOST=...
DB_SWIM_USER=...
DB_HALLOWEEN_HOST=...
DB_HALLOWEEN_USER=...
```

### Adding a New Dashboard

To add a new dashboard (e.g., swim tracking):

1. **Create the backend module** (`backend/dashboards/swim.py`):
```python
class SwimTrackingDashboard:
    metadata = {
        "id": "swim_tracking",
        "title": "Swim Tracking",
        "description": "Track swimming sessions and progress",
        "refreshInterval": 300
    }
    
    async def get_recent_sessions(self):
        # Query your database
        pass
```

2. **Create the frontend page** (`frontend/src/pages/SwimTracking.jsx`):
```jsx
export default function SwimTracking() {
    return <div>{/* Your dashboard UI */}</div>
}
```

3. Configure the environment variables for the swim database and restart.

## Development

### Local Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on http://localhost:8000

### Local Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### CI/CD

GitHub Actions runs CI on every pull request and on pushes to `main`.

Current CI checks:
- Backend tests: `cd backend && python3 -m pytest -q`
- Frontend production build: `cd frontend && npm ci && npm run build`
- Backend Docker smoke test: build backend image, run container, verify `/api/health`

Deployment automation:
- `.github/workflows/deploy.yml` deploys to a DigitalOcean droplet on pushes to `main` using SSH secrets.

Deployment runbook:
- DigitalOcean droplet + Caddy + GitHub Actions: `docs/deploy-digitalocean.md`

## Backlog

- Data quality report feature: scan dashboard datasets for anomalies (for example, stroke totals not matching workout totals), flag suspect rows, and suggest remediation steps.

### Running Tests

```bash
# Backend tests
cd backend && python3 -m pytest

# Frontend tests
cd frontend && npm test
```

### Linting

```bash
# Backend
cd backend && flake8 . --max-line-length=120

# Frontend
cd frontend && npm run lint
```

## API Reference

### Health Check

```
GET /api/health
```

Returns application status.

### Dashboard Discovery

```
GET /api/dashboards
```

Returns metadata for all registered dashboards.

### Dashboard-Specific Endpoints

Each dashboard registers its own endpoints under `/api/dashboards/{dashboard-id}/...`

For example, mortgage rates dashboard:
```
GET /api/dashboards/mortgage_rates/current_rate
GET /api/dashboards/mortgage_rates/historical_rates?days=365
GET /api/dashboards/mortgage_rates/rate_comparison?days=365
GET /api/dashboards/mortgage_rates/rate_statistics?days=365
```

Swim tracking dashboard:
```
GET /api/dashboards/swim_tracking/summary?days=365
GET /api/dashboards/swim_tracking/distance_by_date?days=365
GET /api/dashboards/swim_tracking/records?days=365&limit=50
GET /api/dashboards/swim_tracking/stroke_breakdown?days=365
```

Home office temperature dashboard:
```
GET /api/dashboards/home_office_temperature/current_conditions
GET /api/dashboards/home_office_temperature/temperature_trend?days=365
GET /api/dashboards/home_office_temperature/statistics?days=365
```

Halloween tracking dashboard:
```
GET /api/dashboards/halloween_tracking/summary
GET /api/dashboards/halloween_tracking/yearly_counts
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database credentials per dashboard
DB_MORTGAGE_HOST=
DB_MORTGAGE_USER=
DB_MORTGAGE_PASSWORD=
DB_MORTGAGE_NAME=

DB_SWIM_HOST=
DB_SWIM_USER=
DB_SWIM_PASSWORD=
DB_SWIM_NAME=

# Optional; if omitted, dashboard can reuse mortgage host/user/password with DB_RPI_NAME=rpi
DB_RPI_HOST=
DB_RPI_USER=
DB_RPI_PASSWORD=
DB_RPI_NAME=rpi

DB_HALLOWEEN_HOST=
DB_HALLOWEEN_USER=
DB_HALLOWEEN_PASSWORD=
DB_HALLOWEEN_NAME=halloween

# Application settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
CORS_ALLOWED_ORIGINS=*
ENABLE_MORTGAGE_DASHBOARD=true
ENABLE_SWIM_DASHBOARD=true
ENABLE_RPI_DASHBOARD=true
ENABLE_HALLOWEEN_DASHBOARD=true

# Frontend API target (optional for local dev via Vite proxy)
# Docker build uses this value from docker-compose build args.
VITE_API_URL=http://localhost:8000

# Public hostname for production Caddy reverse-proxy
APP_DOMAIN=analytics.example.com
```

## Troubleshooting

### Backend can't connect to database
- Verify database credentials in `.env`
- Verify dashboard toggle flags (e.g., `ENABLE_SWIM_DASHBOARD`) match intended enabled dashboards
- Ensure MySQL instance is running
- Check network connectivity to the database host

### Frontend can't reach backend API
- Verify backend is running on http://localhost:8000
- For local dev (`npm run dev`), ensure Vite proxy is enabled in `frontend/vite.config.js`
- For Docker image builds, set `VITE_API_URL` in `.env` before `docker-compose up --build`
- Check browser console for CORS errors

### Docker Compose issues
- Run `docker-compose down` then `docker-compose up --build` to rebuild
- Check logs: `docker-compose logs -f backend` or `docker-compose logs -f frontend`

### Production deployment
- Follow `docs/deploy-digitalocean.md` for droplet setup, TLS, and CI/CD deployment.

## Contributing

Contributions are welcome! Follow the architecture patterns established in the first dashboard when adding new features.

## Operations

For operational checks and incident triage steps, see `OPERATIONS.md`.

## License

MIT
