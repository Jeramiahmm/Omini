# Omini

Route optimization and dispatch platform for trash collection operations in Longmont, Boulder, and Lyons, Colorado.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, OR-Tools, Uvicorn
- **Database**: PostgreSQL with PostGIS (Neon)
- **Frontend**: Next.js 16, Tailwind CSS v4, Mapbox GL JS

## Local Setup

### Backend

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Neon database credentials

# Run database migrations
alembic upgrade head

# Start the backend
python main.py
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_MAPBOX_TOKEN (get one free at mapbox.com)

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:3000`. API calls are proxied to the backend via Next.js rewrites.

## Features

### Dispatcher Dashboard (/)
- Upload stops via CSV (format: `address,lat,lng`)
- Add stops manually with lat/lng coordinates
- One-click route optimization using OR-Tools
- Dark-themed Mapbox map with numbered markers and route line
- Save optimized routes for drivers
- Load and manage saved routes

### Driver Mode (/driver/[routeId])
- Mobile-first interface for drivers on the road
- Current stop with address and coordinates
- Next stop preview
- Progress tracking (completed / total with progress bar)
- Google Maps navigation (opens in new tab or mobile app)
- Mark Complete to advance to next stop
- View all stops in collapsible list

### Route Optimization
- OR-Tools TSP solver with guided local search
- Haversine distance matrix
- Handles 2-500 stops
- Performance: ~200ms for 50 stops, ~2.5s for 500 stops

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/optimize-route | Optimize stop order (stateless) |
| POST | /api/routes | Save an optimized route |
| GET | /api/routes | List saved routes with stats |
| GET | /api/routes/{id} | Get route with all stops |
| DELETE | /api/routes/{id} | Delete a route |
| PATCH | /api/route-stops/{id}/complete | Mark a stop complete |

### Example: Optimize Route

```bash
curl -X POST http://localhost:8000/api/optimize-route \
  -H "Content-Type: application/json" \
  -d '[
    {"id": 1, "lat": 40.1672, "lng": -105.1019, "address": "123 Main St"},
    {"id": 2, "lat": 40.1748, "lng": -105.0987, "address": "456 Oak Ave"},
    {"id": 3, "lat": 40.1591, "lng": -105.1056, "address": "789 Pine Dr"}
  ]'
```

Response:
```json
{
  "route": [1, 2, 3],
  "distance": 3681.0,
  "duration": 441.72
}
```

## Project Structure

```
Omini/
├── app/                    # FastAPI backend
│   ├── __init__.py         # App factory
│   ├── config.py           # Settings from .env
│   ├── database.py         # SQLAlchemy async engine
│   ├── models/             # ORM models (Stop, Route, RouteStop)
│   ├── schemas/            # Pydantic request/response models
│   ├── routers/            # API endpoints
│   └── services/           # OR-Tools optimizer
├── migrations/             # Alembic database migrations
├── frontend/               # Next.js frontend
│   ├── app/                # Pages (dashboard, driver mode)
│   ├── components/         # React components
│   └── lib/                # API client
├── main.py                 # Uvicorn entrypoint
└── requirements.txt        # Python dependencies
```
