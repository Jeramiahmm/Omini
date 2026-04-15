# Omini

Route optimization and dispatch platform for trash collection operations in Longmont, Boulder, and Lyons, Colorado.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, OR-Tools, Uvicorn
- **Database**: PostgreSQL with PostGIS (Neon)
- **Frontend**: Next.js 16, Tailwind CSS, Mapbox GL JS

## Local Setup

### Backend

```bash
# 1. Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run database migrations
alembic upgrade head

# 5. Start the backend
python main.py
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_MAPBOX_TOKEN and NEXT_PUBLIC_API_URL

# 3. Start the dev server
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/optimize-route | Optimize stop order (stateless) |
| POST | /api/routes | Save an optimized route |
| GET | /api/routes | List saved routes |
| GET | /api/routes/{id} | Get route with stops |
| PATCH | /api/route-stops/{id}/complete | Mark a stop complete |

### Optimize Route

```
POST /api/optimize-route
Content-Type: application/json

[
  {"id": 1, "lat": 40.1672, "lng": -105.1019, "address": "123 Main St"},
  {"id": 2, "lat": 40.1748, "lng": -105.0987, "address": "456 Oak Ave"},
  {"id": 3, "lat": 40.1591, "lng": -105.1056, "address": "789 Pine Dr"}
]
```

Response:

```json
{
  "route": [1, 3, 2],
  "distance": 2345.67,
  "duration": 281.48
}
```

## Features

- **Dispatcher Dashboard**: Map-based route planning with CSV upload and manual stop entry
- **Route Optimization**: OR-Tools TSP solver with haversine distance matrix
- **Driver Mode**: Mobile-first interface with Google Maps navigation and stop completion tracking
- **Route Persistence**: Save/load routes with completion state
