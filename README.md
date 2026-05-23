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

Implementation lives in `backend/recommendations/scoring.py`.

### Slide 13 — Trending score

For each outfit or reel:

**Trending Score = (Likes × 3) + (Comments × 5) + (Views × 1)**

Trending lists (`GET /api/feed/home/`):
1. Optionally filter by period: `period=daily` | `weekly` | `monthly` (default: `weekly`)
2. Score each post with the formula above
3. Sort by `trending_score` descending and return top N

Response fields include `trending_period` and `trending_formula` for documentation/UI.

### Rule-based recommendations (initial phase)

`GET /api/recommendations/for-you/` (JWT required) combines:

| Rule | Description |
|------|-------------|
| **Similar tags** | Posts that share tags with outfits you **liked** |
| **Preferred categories** | Posts in tags you engage with often (tags from **likes + views**; tags act as style categories) |
| **Trending outfits** | High trending score within the selected period |
| **User likes & views** | Extra boost when tags match your like/view history |

**Note:** “Saves” are not stored yet; **likes** and **views** are used as preference signals.

**Recommendation score** (per candidate):

```
recommendation_score =
  (trending_score × 1.0)
  + (similar_tag_matches × 5.0)
  + (preferred_category_matches × 4.0)
  + (liked_tag_matches × 6.0)
  + (viewed_tag_matches × 2.0)
```

Query params:
- `limit` — number of results (default 10)
- `period` — `daily` | `weekly` | `monthly` for trending window (default `weekly`)

The API returns `for_you_outfits` sorted by `recommendation_score`, plus a `rules` object describing the logic (suitable for reports/slides).

## Deployment Notes (Render/Fly/Railway)
1. Use managed PostgreSQL and set `DATABASE_URL`.
2. Set `DJANGO_SECRET_KEY` and `DEBUG=false`.
3. Media storage:
   - This MVP uses local media storage for simplicity.
   - For production, use S3-compatible storage (e.g., AWS S3, Cloudflare R2) for uploaded images/videos.

