# PantryPilot Web

Local Next.js frontend for the working PantryPilot Fastify API at `http://localhost:3001`.

## Requirements

- Node.js 22 LTS or newer
- npm
- PantryPilot API running locally on port 3001
- Docker only for the separate API/PostgreSQL project

## Windows PowerShell setup

```powershell
Set-Location C:\Projects
Expand-Archive -Path "$HOME\Downloads\PantryPilot-Web.zip" -DestinationPath C:\Projects -Force
Set-Location C:\Projects\PantryPilot-Web
Copy-Item .env.local.example .env.local
npm install
npm run validate
npm run dev
```

Open `http://localhost:3000`.

Run the API in a different terminal:

```powershell
Set-Location C:\Projects\PantryPilot
docker compose up -d postgres
npm run dev
```

## macOS/Linux setup

```bash
cd ~/Projects
unzip ~/Downloads/PantryPilot-Web.zip
cd PantryPilot-Web
cp .env.local.example .env.local
npm install
npm run validate
npm run dev
```

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_VERSION=local
NEXT_PUBLIC_DEPLOYMENT_ENV=local
NEXT_PUBLIC_ALLOW_DEV_AUTH=true
```

Development authentication adds `Bearer dev-token` only when both conditions are true:

- `NEXT_PUBLIC_ALLOW_DEV_AUTH=true`
- `NEXT_PUBLIC_DEPLOYMENT_ENV` is not `production`

`next.config.ts` stops the build if development authentication is enabled for a production deployment. Never place secrets in `NEXT_PUBLIC_*` variables.

## Commands

```powershell
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Architecture

- PostgreSQL through the Fastify API is authoritative.
- The browser does not persist pantry data to localStorage.
- Every write uses the server-returned item version.
- HTTP 409 causes an authoritative refresh and visible conflict message.
- API failures can include a correlation ID for support and diagnostics.

## E2E tests

Playwright intercepts the API with a deterministic in-memory service so frontend workflows can run independently. For full-stack validation, start the real API and add a separate non-mocked test project against a resettable test database.
