# Operations Runbook

This document covers routine checks and incident triage for `analytics-hub`.

## Quick Status Checks

Run these from the project root.

```bash
curl -s http://localhost:8000/api/health | jq
curl -s -i http://localhost:8000/api/ready
```

Interpretation:
- `/api/health`: liveness and app metadata. Should return `200`.
- `/api/ready`: dependency readiness per dashboard.
  - Returns `200` when all enabled dashboards are ready.
  - Returns `503` when any enabled dashboard fails DB readiness.

## Dashboard Enablement

Dashboard registration is controlled by env flags:
- `ENABLE_MORTGAGE_DASHBOARD`
- `ENABLE_SWIM_DASHBOARD`
- `ENABLE_RPI_DASHBOARD`
- `ENABLE_HALLOWEEN_DASHBOARD`

If a dashboard is enabled, required DB env vars must be present or startup fails fast.

## Logging

Configured via:
- `LOG_LEVEL=INFO|DEBUG|WARNING|ERROR`

Request logs include:
- `request_id`
- HTTP method/path/status
- request duration

`x-request-id` is returned in responses. Supply one in request headers for end-to-end tracing.

Example:

```bash
curl -H "x-request-id: local-debug-123" -i http://localhost:8000/api/health
```

## Common Incident Scenarios

### 1. API returns `503` on `/api/ready`

Steps:
1. Inspect readiness payload for failing dashboard and error string.
2. Verify dashboard enable flags in `.env`.
3. For enabled dashboards, validate DB host/user/password/name/port values.
4. Confirm network reachability to MySQL from runtime environment.
5. Restart backend and re-check `/api/ready`.

### 2. Backend starts but dashboard is missing from `/api/dashboards`

Steps:
1. Verify corresponding `ENABLE_*_DASHBOARD` flag is `true`.
2. Confirm required DB vars for that dashboard are set.
3. Check startup logs for `Skipping disabled dashboard` or configuration errors.

### 3. Frontend loads but dashboard calls fail

Steps:
1. Check browser network response for `x-request-id`.
2. Search backend logs for that `request_id`.
3. Validate backend `/api/ready`.
4. Confirm frontend API target:
   - Local dev uses Vite proxy.
   - Docker builds use `VITE_API_URL`.

## Recovery / Rollback (Application Level)

If a recent change breaks readiness:
1. Disable the affected dashboard via env toggle.
2. Restart backend.
3. Verify `/api/ready` is healthy for remaining enabled dashboards.
4. Re-enable only after config or code fix is validated.

## Deployment

- DigitalOcean deployment runbook: `docs/deploy-digitalocean.md`
- Automated deployment workflow: `.github/workflows/deploy.yml`
