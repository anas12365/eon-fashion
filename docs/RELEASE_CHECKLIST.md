# EON Fashion — Release Checklist

Documentation only — this file describes steps to run at deploy time. It
does not change application behavior by itself. See `PROJECT_STATUS.md`
for current phase status, `ARCHITECTURE.md` for system design, and
`MIGRATION.md` for the Firebase Storage → Django Media migration this
checklist assumes.

## 1. Required environment variables

### Frontend (root `.env`, from `.env.example`)
| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Django API base URL, including `/api` |
| `VITE_USE_DJANGO` | Yes | `true` in production — see `src/lib/featureFlags.js` |
| `VITE_FIREBASE_API_KEY` | Only if Firestore fallback/legacy auth is in use | App runs without it — see `FIREBASE_SETUP.md` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above | |
| `VITE_FIREBASE_PROJECT_ID` | Same as above | |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above | Legacy Firebase Storage URLs still render regardless (see `MIGRATION.md`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above | |
| `VITE_FIREBASE_APP_ID` | Same as above | |

### Backend (`backend/.env`, from `backend/.env.example`)
| Variable | Required | Notes |
|---|---|---|
| `DJANGO_SECRET_KEY` | Yes | Real random value in production, never the example placeholder |
| `DJANGO_DEBUG` | Yes | Must be `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Yes | Comma-separated production hostnames |
| `DJANGO_TIME_ZONE` | No | Defaults to `UTC` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Yes | PostgreSQL connection |
| `CORS_ALLOWED_ORIGINS` | Yes | Must include the deployed frontend origin |
| `DJANGO_SECURE_SSL_REDIRECT` | Yes in prod | `True` once behind HTTPS |
| `DJANGO_SESSION_COOKIE_SECURE` | Yes in prod | `True` once behind HTTPS |
| `DJANGO_CSRF_COOKIE_SECURE` | Yes in prod | `True` once behind HTTPS |
| `DJANGO_SECURE_HSTS_SECONDS` / `..._INCLUDE_SUBDOMAINS` / `..._PRELOAD` | Recommended in prod | See Phase 6.1 hardening notes in `backend/.env.example` |
| `DJANGO_SECURE_PROXY_SSL_HEADER` | Only if behind a TLS-terminating proxy | Only enable if the proxy actually sets `X-Forwarded-Proto` |
| `ADMIN_LOGIN_THROTTLE_RATE` | No | Defaults to `5/min` |
| `DJANGO_LOG_LEVEL` | No | Defaults to `INFO`/`WARNING` based on `DJANGO_DEBUG` |
| `DATA_UPLOAD_MAX_MEMORY_SIZE` / `FILE_UPLOAD_MAX_MEMORY_SIZE` | No | Default 10MB each (Phase 6.2/6.3) — raise only if needed |

## 2. Database migration

```bash
cd backend
python manage.py makemigrations --check --dry-run   # confirm zero pending model changes
python manage.py migrate
```

`migrate` must be run after this release even if you migrated before —
Phase 6.3 added `rest_framework_simplejwt.token_blacklist` to
`INSTALLED_APPS` (see `CHANGELOG.md`). That app ships its own bundled
migrations; nothing was added to this repo's own `migrations/`
directories. Confirm the blacklist tables exist post-migrate:

```bash
python manage.py showmigrations token_blacklist
# both 0001_initial and 0002_... should show [X]
```

This is additive and non-destructive: existing outstanding refresh
tokens keep working unchanged; only a token that gets rotated after
this point is blacklisted going forward (see `MIGRATION.md` /
`CHANGELOG.md` Phase 6.3 for details).

## 3. Static & media files

```bash
python manage.py collectstatic --noinput
```

Confirm `MEDIA_ROOT` (`backend/media/`) is writable by the process user
and is served correctly by your reverse proxy/web server in production —
Django's built-in `static()` media serving (wired in `eon_backend/urls.py`)
only runs automatically when `DEBUG=True`.

## 4. Frontend build

```bash
npm install
npm run build
```

Confirm the build output references `VITE_API_BASE_URL` pointing at the
production Django deployment, not `localhost`. Vite bakes `VITE_*`
values in at build time — set them in the build environment, not just at
runtime.

## 5. Production deployment checks

- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_SECRET_KEY` is a real secret, not the example placeholder
- [ ] `DJANGO_ALLOWED_HOSTS` lists the real production domain(s) only
- [ ] `CORS_ALLOWED_ORIGINS` lists the real frontend origin(s) only
- [ ] HTTPS cookie/HSTS settings enabled (see table above)
- [ ] `python manage.py migrate` run, including `token_blacklist` tables confirmed
- [ ] `python manage.py collectstatic` run
- [ ] `npm run build` completed against production `VITE_API_BASE_URL`
- [ ] Admin login, Product CRUD, Django image upload, and existing Firebase-hosted
      product images all verified against the deployed environment (see
      `PROJECT_STATUS.md` Phase 6.4 for the traced/static verification already
      performed pre-deploy)
- [ ] Legacy Firebase Storage files are still intact and untouched — this release
      does not delete them (see `MIGRATION.md` known limitations)
