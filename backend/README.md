# EON Backend (Django REST Framework + PostgreSQL)

This is additive to the existing Firebase-backed frontend — nothing in
`../src` was changed to make room for this. It's a parallel API that the
frontend can be pointed at later via `src/services/api.js`.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # then fill in real values

# create the Postgres database first, e.g.:
#   createdb eon_db

python manage.py migrate
python manage.py createsuperuser  # this account is your admin login
python manage.py runserver        # http://127.0.0.1:8000
```

Django admin: http://127.0.0.1:8000/admin/

## API reference

### Auth (admin only — no customer accounts)
| Method | Endpoint              | Auth       | Notes                          |
|--------|------------------------|-----------|---------------------------------|
| POST   | `/api/auth/login/`     | none      | `{username, password}` -> `{access, refresh}` |
| POST   | `/api/auth/refresh/`   | none      | `{refresh}` -> `{access}`      |
| GET    | `/api/auth/me/`        | JWT       | current admin's identity        |

### Products
| Method | Endpoint                | Auth  | Notes |
|--------|--------------------------|-------|-------|
| GET    | `/api/products/`         | none  | visible products only; `?all=1` (admin) includes hidden; `?category=`, `?search=`, `?ordering=` |
| GET    | `/api/products/<id>/`    | none  | |
| POST   | `/api/products/`         | admin | |
| PUT    | `/api/products/<id>/`    | admin | |
| PATCH  | `/api/products/<id>/`    | admin | |
| DELETE | `/api/products/<id>/`    | admin | |

### Orders
| Method | Endpoint                        | Auth  | Notes |
|--------|-----------------------------------|-------|-------|
| POST   | `/api/orders/`                   | none  | checkout — no login required |
| GET    | `/api/orders/`                   | admin | |
| GET    | `/api/orders/<id>/`               | admin | |
| PATCH  | `/api/orders/<id>/status/`        | admin | `{status: "Shipped"}` |

Send the JWT as `Authorization: Bearer <access>`.

## Data shape notes

- `Product.images` is a JSON list in the same two-shape format the
  frontend already handles: `[{"large": "url", "thumb": "url"}]` (or plain
  string URLs for legacy data). `src/lib/images.js` needs no changes.
- `Product.sizes` / `Product.colors` are JSON lists of strings, same as
  the current Firestore documents.
- `discount` is a percentage (0-100); `effectivePrice` on the product
  response is the already-discounted price, mirroring
  `withEffectivePrice()` in `src/lib/db/products.js`.

## Deployment checklist

- Set `DJANGO_DEBUG=False` and a real `DJANGO_SECRET_KEY`.
- Set `DJANGO_ALLOWED_HOSTS` to your real domain(s).
- Set `CORS_ALLOWED_ORIGINS` to your real frontend origin(s).
- Run `python manage.py collectstatic`.
- Serve with `gunicorn eon_backend.wsgi:application` behind a reverse
  proxy (nginx/Caddy) that terminates TLS.
- Use a managed/production Postgres instance, not the dev defaults.
