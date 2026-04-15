# Omini

Route optimization and dispatch platform for trash collection operations in Longmont, Boulder, and Lyons, Colorado.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, OR-Tools, Uvicorn
- **Database**: PostgreSQL with PostGIS (Neon)
- **Frontend**: Next.js, Tailwind CSS, Mapbox GL JS (coming soon)

## Local Setup

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

# 5. Start the server
python main.py
```

The server runs at `http://localhost:8000`. API docs are at `http://localhost:8000/docs`.

## API

### Health Check

```
GET /health
```

### Optimize Route

```
POST /api/optimize-route
Content-Type: application/json

[
  {"id": 1, "lat": 40.1672, "lng": -105.1019},
  {"id": 2, "lat": 40.1748, "lng": -105.0987},
  {"id": 3, "lat": 40.1591, "lng": -105.1056},
  {"id": 4, "lat": 40.1823, "lng": -105.1102},
  {"id": 5, "lat": 40.1700, "lng": -105.0890}
]
```

Response:

```json
{
  "route": [1, 5, 2, 4, 3],
  "distance": 5432.10,
  "duration": 651.85
}
```

- `route`: Stop IDs in optimal visit order
- `distance`: Total route distance in meters
- `duration`: Estimated duration in seconds (at 30 km/h average)
