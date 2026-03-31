# Fashion Website (Final-Year Project)

Instagram-like fashion app where users can post outfits (images), watch reels (short videos), and engage with likes/comments/views. Home shows:
- **Trending** outfits and reels (time-decayed engagement ranking)
- **For You** outfits (tag-based recommendations using your likes)

Built with:
- **Backend:** Django + Django REST Framework + PostgreSQL + JWT
- **Frontend:** React (Vite) + Axios

## Project Structure
- `backend/` Django project
- `frontend/` React app

## Local Setup

### 1) Backend
1. Create/activate a Python environment (the repo includes `backend/.venv`):
   - `cd backend`
2. Install dependencies:
   - `pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers django-filter Pillow psycopg2-binary dj-database-url gunicorn`
3. Environment variables:
   - `DJANGO_SECRET_KEY` (required for production; optional locally)
   - `DEBUG` (set to `false` for production)
   - `DATABASE_URL` (optional; if not set, SQLite is used)

4. Migrate + run:
   - `python manage.py makemigrations`
   - `python manage.py migrate`
   - `python manage.py runserver`

Media uploads are served from `/media/` in development.

### 2) Frontend
1. `cd frontend`
2. Install dependencies:
   - `npm install`
3. Set API base URL (optional):
   - `VITE_API_BASE_URL=http://localhost:8000`
4. Run:
   - `npm run dev`

### 3) Testing
Run backend tests:
- `cd backend`
- `python manage.py test`

## Troubleshooting: "Given token not valid for any token type"

This usually means the JWT in the browser no longer matches what the server expects.

1. **Log out and log in again** (or clear site data for `localhost`).
2. If you **changed `DJANGO_SECRET_KEY`** or restarted with a different key, **old tokens are invalid** — sign in again.
3. The frontend now **auto-refreshes** the access token when it expires (using the refresh token). If both are invalid, you must sign in again.

## Environment Variables (Recommended)

Backend:
- `DJANGO_SECRET_KEY` (string)
- `DEBUG` (`true`/`false`)
- `DATABASE_URL` (e.g., `postgres://USER:PASSWORD@HOST:5432/DBNAME`)
- `ALLOWED_HOSTS` (comma-separated hostnames)

Frontend:
- `VITE_API_BASE_URL` (e.g., `http://localhost:8000`)

## API Endpoints (Core)

Auth:
- `POST /api/auth/register/`
- `GET /api/auth/me/` (current user; requires JWT)
- `POST /api/auth/token/` (JWT access + refresh)
- `POST /api/auth/token/refresh/`

Outfits:
- `GET /api/outfits/` (list)
- `POST /api/outfits/` (create, requires JWT)
- `GET /api/outfits/{id}/` (retrieve)
- `POST /api/outfits/{id}/like/` (toggle, requires JWT)
- `GET /api/outfits/{id}/like-status/` (requires JWT)
- `POST /api/outfits/{id}/view/` (increments view count; dedupes per user if logged in)
- `GET /api/outfits/{id}/comments/`
- `POST /api/outfits/{id}/comments/` (requires JWT)

Reels:
- `GET /api/reels/`
- `POST /api/reels/`

Home feed:
- `GET /api/feed/home/` (Trending outfits/reels + Latest outfits)
- `GET /api/feed/trending-tags/` (tags ranked by outfit usage)
- `GET /api/feed/top-creators/` (users ranked by total likes on their outfit posts)

Recommendations:
- `GET /api/recommendations/for-you/` (requires JWT)

## Ranking / Recommendation Logic (Report-Ready)

### 1) Trending Score (Home)
For each outfit/reel, we compute:

`score = (likes*ALPHA + comments*BETA + views*GAMMA) / (hours_since_published + 2)^DELTA`

Constants (current implementation):
- `ALPHA = 1.0` (likes weight)
- `BETA = 2.0` (comments weight)
- `GAMMA = 1.0` (views weight)
- `DELTA = 1.5` (time decay)

Trending lists are computed by:
1. Taking the most recent ~200 items
2. Computing the score in application code
3. Sorting by score desc and returning top N

### 2) “For You” Recommendations
For a logged-in user:
1. Extract **top liked tags** from outfits they liked.
2. Build candidates as:
   - **recent popular** outfits (highest like/view counters)
   - plus outfits matching those top tags
3. For each candidate compute:
   - `engagement_score` using the same time-decayed formula as Trending
   - `final_score = engagement_score + tag_match_count * TAG_MATCH_BONUS`

Constants:
- `TAG_MATCH_BONUS = 5.0`

The API returns the top `limit` outfits ordered by `final_score`.

## Deployment Notes (Render/Fly/Railway)
1. Use managed PostgreSQL and set `DATABASE_URL`.
2. Set `DJANGO_SECRET_KEY` and `DEBUG=false`.
3. Media storage:
   - This MVP uses local media storage for simplicity.
   - For production, use S3-compatible storage (e.g., AWS S3, Cloudflare R2) for uploaded images/videos.

