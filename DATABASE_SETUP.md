# FitmentAI Database Setup

This project is wired for Supabase using server-side API routes.

## 1. Create Supabase Project

Go to https://supabase.com and create a new project.

## 2. Create Tables

Open Supabase SQL Editor and paste the contents of:

```txt
supabase-schema.sql
```

Run it once. It creates:

- `profiles`
- `vehicles`
- `parts`
- `part_sources`
- `builds`
- `build_parts`
- `fitment_checks`
- `fitment_feedback`
- `waitlist`

## 3. Add Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```txt
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Use the **service role key only on the server**. Do not expose it in browser code or any `NEXT_PUBLIC_` variable.

Optional Ask FitmentAI live AI:

```txt
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

If `GEMINI_API_KEY` is blank, Ask FitmentAI uses the local MVP fallback response.

## 4. What Works Now

These routes already write to Supabase when env vars are configured:

- `POST /api/waitlist` -> inserts into `waitlist`
- `POST /api/score` -> inserts into `fitment_checks`

If Supabase env vars are missing, the app stays in demo mode and returns a message instead of crashing.

## 5. Recommended Next Database Features

Build in this order:

1. Supabase Auth
2. Save garage vehicles to `vehicles`
3. Save user builds to `builds` and `build_parts`
4. Move public catalog records into `parts` and `part_sources`
5. Save user install outcomes into `fitment_feedback`
6. Use saved database context in the AI assistant
