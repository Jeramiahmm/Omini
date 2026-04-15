# Omini

Route optimization and dispatch platform for trash collection. A lightweight, local alternative to UPS Orion — built for small companies operating in Longmont, Boulder, and Lyons, Colorado.

## Stack

- **App**: Next.js 16 (App Router, API Routes)
- **Database**: PostgreSQL via Neon (serverless)
- **Map**: Mapbox GL JS (dark theme)
- **Optimizer**: TypeScript TSP solver (nearest-neighbor + 2-opt + or-opt)
- **Deploy**: Vercel (single platform, zero infrastructure)

## Deploy to Vercel

### 1. Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. In the SQL Editor, paste and run the contents of `frontend/lib/schema.sql`
3. Copy your connection string from Connection Details

### 2. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel reads `vercel.json` and uses `frontend/` as the root
4. Set environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Token from [mapbox.com](https://account.mapbox.com) |

5. Deploy — that's it

### Neon + Vercel Integration (Optional)

Instead of manually setting `DATABASE_URL`, you can use Vercel's Neon integration:
1. In Vercel dashboard → your project → Storage → Connect Store → Neon
2. This auto-sets the `DATABASE_URL` environment variable

## Local Development

```bash
cd frontend
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in DATABASE_URL and NEXT_PUBLIC_MAPBOX_TOKEN

npm run dev
```

App runs at `http://localhost:3000`.

## Features

### Dispatcher Dashboard (/)
- Upload stops via CSV (`address,lat,lng`)
- Add stops manually
- One-click route optimization (2-500 stops)
- Dark Mapbox map with numbered markers and route line
- Save/load/delete routes

### Driver Mode (/driver/[routeId])
- Mobile-first interface
- Current stop + next stop preview
- Progress tracking with completion percentage
- Google Maps navigation link
- Mark Complete to advance
- View all stops list

### Route Optimizer
- Nearest-neighbor construction + 2-opt + or-opt local search
- 100 stops in ~18ms, 500 stops in ~86ms
- Handles the full Longmont/Boulder/Lyons service area

## API

| Method | Path | Description |
|---|---|---|
| GET | /api/health | Health check |
| POST | /api/optimize-route | Optimize stop order |
| POST | /api/routes | Save route |
| GET | /api/routes | List routes |
| GET | /api/routes/[id] | Get route detail |
| DELETE | /api/routes/[id] | Delete route |
| PATCH | /api/route-stops/[id]/complete | Mark stop done |
