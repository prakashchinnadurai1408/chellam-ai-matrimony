# Chellam Production Migration

This repo now has an incremental migration path from the generated Lovable/Supabase stack to a production-oriented React + FastAPI + PostgreSQL architecture.

## What changed

- Added a new Python backend in `backend/` with:
  - FastAPI application entrypoint
  - CORS and environment-based config
  - PostgreSQL-ready SQLAlchemy models for the current Supabase schema
  - A dedicated LLM service layer
  - Deterministic matchmaking logic with optional OpenAI-generated insights
- Frontend AI features now call FastAPI through `src/lib/api.ts` instead of invoking Supabase edge functions directly.

## Current split of responsibilities

- `src/`: React UI, current Supabase auth, current Supabase data reads/writes, storage uploads
- `backend/`: new Python API, future business logic home, future PostgreSQL home
- `supabase/`: legacy source of truth during migration

## Migration map

| Current capability | Current implementation | Target implementation |
| --- | --- | --- |
| AI chatbot | Supabase Edge Function `ai-chat` | FastAPI route `POST /api/v1/ai/chat` |
| AI matching | Supabase Edge Function `ai-match` | FastAPI route `POST /api/v1/ai/match` |
| Profiles | Supabase table `profiles` | PostgreSQL table via SQLAlchemy `Profile` |
| Preferences | Supabase table `partner_preferences` | PostgreSQL table via SQLAlchemy `PartnerPreference` |
| Messaging | Supabase tables + realtime | FastAPI messaging API + websockets |
| Memberships | Supabase tables | FastAPI admin/payment services |
| Auth | Supabase auth | FastAPI JWT/OAuth layer |
| File uploads | Supabase storage | S3-compatible object storage |

## Recommended next phases

1. Add Alembic migrations from the SQLAlchemy models in `backend/app/models`.
2. Move profile, preference, and search list APIs into FastAPI so the React app no longer reads core data from Supabase.
3. Replace Supabase auth with JWT or OAuth and update `AuthContext`.
4. Move uploads from Supabase Storage to S3 or Cloudflare R2.
5. Port realtime messaging to FastAPI websockets or a dedicated message broker.

## Local development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The frontend expects `VITE_API_URL=http://localhost:8000/api/v1`.
