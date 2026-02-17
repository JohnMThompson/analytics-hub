# Copilot Instructions for AI Analytics

## Project Overview
A self-hosted analytics dashboard platform replacing Metabase. Currently supports hobby data projects (mortgage rates, swim tracking) with MySQL backend. Designed for easy extension to new dashboards.

## Architecture

### Tech Stack
- **Backend**: Python with Flask/FastAPI
- **Frontend**: React or Vue.js  
- **Database**: MySQL (external, configured via environment variables)
- **Deployment**: Docker + Docker Compose

### Key Design Patterns

#### Dashboard Extensibility
Dashboards are plugin-like Python modules in `backend/dashboards/`. Each dashboard module:
- Defines data query functions to fetch from MySQL
- Exports metadata (title, description, refresh interval)
- Registers API endpoints via the framework router
- Frontend automatically discovers dashboards via `/api/dashboards` endpoint

Example structure:
```python
# backend/dashboards/mortgage.py
class MortgageRateDashboard:
    metadata = {
        "id": "mortgage_rates",
        "title": "Mortgage Rates",
        "description": "Current rates and historical trends"
    }
    
    def get_current_rate(self):
        # Query MySQL
        pass
```

#### Database Connection
- Single connection pool configured in `backend/config.py`
- Environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Reusable query functions in `backend/queries/` for common patterns

### Directory Structure
```
ai-analytics/
├── backend/
│   ├── app.py                 # Flask/FastAPI app creation & route registration
│   ├── config.py              # Database & app configuration from env vars
│   ├── dashboards/            # Dashboard modules (mortgage.py, swim.py, etc.)
│   ├── queries/               # Reusable SQL query builders
│   ├── models/                # Data models/schemas for validation
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Dashboard, Chart, Filters)
│   │   ├── services/          # API client code
│   │   ├── pages/             # Page-level components
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         # Orchestrates backend + frontend
├── README.md
└── .github/copilot-instructions.md
```

## Build, Test & Lint Commands

### Backend (Python)

**Install dependencies:**
```bash
cd backend && pip install -r requirements.txt
```

**Run development server:**
```bash
cd backend && python app.py
# or with Flask/FastAPI CLI
cd backend && flask run  # if using Flask
cd backend && uvicorn app:app --reload  # if using FastAPI
```

**Run tests:**
```bash
cd backend && pytest  # full test suite
cd backend && pytest tests/test_dashboards.py  # single test file
cd backend && pytest tests/test_dashboards.py::test_mortgage_current_rate  # single test
```

**Run linter:**
```bash
cd backend && flake8 . --max-line-length=120
# or with ruff
cd backend && ruff check .
```

**Run type checker:**
```bash
cd backend && mypy . --ignore-missing-imports
```

### Frontend (React/Vue)

**Install dependencies:**
```bash
cd frontend && npm install
```

**Run development server:**
```bash
cd frontend && npm start  # React
# or
cd frontend && npm run dev  # Vue with Vite
```

**Build for production:**
```bash
cd frontend && npm run build
```

**Run tests:**
```bash
cd frontend && npm test  # full test suite
cd frontend && npm test -- Dashboard.test.jsx  # single test file
cd frontend && npm test -- --testNamePattern="renders current rate"  # single test
```

**Run linter:**
```bash
cd frontend && npm run lint
```

### Docker & Compose

**Build and run with Docker Compose:**
```bash
docker-compose up  # starts backend & frontend in development mode
docker-compose up --build  # rebuild images first
docker-compose down  # stop all services
```

**View logs:**
```bash
docker-compose logs -f backend  # follow backend logs
docker-compose logs -f frontend  # follow frontend logs
```

## Common Development Tasks

### Adding a New Dashboard

1. Create `backend/dashboards/your_project.py` with a dashboard class
2. Define `metadata` dict with id, title, description
3. Implement query methods to fetch from MySQL
4. Register in `backend/app.py` router
5. Create React component in `frontend/src/components/YourProject.jsx`
6. Add to dashboard discovery in frontend routing

### Modifying Database Queries

- Always use parameterized queries to prevent SQL injection
- Query builders in `backend/queries/` should abstract common patterns
- Test new queries in `tests/test_queries.py`

### Environment Configuration

Database connection requires these environment variables:
- `DB_HOST` - MySQL server hostname
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password  
- `DB_NAME` - Database name
- `DB_PORT` (optional, defaults to 3306)

Set in `.env` file (not committed) or via Docker Compose `environment:` section.

## Key Conventions

### Python Backend
- Use type hints for function arguments and returns
- Dashboard modules follow the plugin pattern: class-based with `metadata` dict
- All database queries should be async if using FastAPI
- Tests should mock database calls for unit tests

### Frontend
- Dashboard components are controlled components (state managed by parent)
- API calls go through `services/api.js` client module
- Environment variable: `REACT_APP_API_URL` (defaults to `http://localhost:5000`)

### File Naming
- Dashboard modules: snake_case (e.g., `mortgage.py`, `swim.py`)
- React components: PascalCase (e.g., `Dashboard.jsx`, `MortgageRates.jsx`)
- Tests: `test_*.py` (Python) or `*.test.jsx` (React)

## Database Schema Expectations

The MySQL database should have tables for:
- **Mortgage tracking**: timestamp, rate, source
- **Swim tracking**: date, duration_minutes, distance_yards, notes

Add schema in `backend/migrations/` or document in README.md for manual setup.

## Testing Strategy

- **Unit tests**: Mock database, test business logic
- **Integration tests**: Use test database or Docker container for real queries
- **API tests**: Test endpoints with sample data
- **UI tests**: Test React components with sample data

## Debugging Tips

- Backend: Set `FLASK_ENV=development` (Flask) or use `--reload` with uvicorn
- Frontend: Use React DevTools browser extension
- Database: Test queries directly with `mysql -u user -p database < query.sql`
- Logs: Check `docker-compose logs` for startup errors

## Performance Considerations

- Cache dashboard metadata to avoid repeated /api/dashboards calls
- Pre-calculate aggregations in database for 365-day views
- Consider pagination for large result sets
- Monitor API response times as dashboard count grows
