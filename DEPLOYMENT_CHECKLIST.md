# FitmentAI Deployment Checklist

Use this before sharing a public link.

## 1. Rotate The Exposed Supabase Key

You pasted a Supabase service role key during setup, so rotate it before deploying.

1. Open Supabase.
2. Go to Project Settings -> API.
3. Rotate or regenerate the service role secret.
4. Replace the old value in `.env.local` and later in Vercel.

Never put the service role key in browser code or any `NEXT_PUBLIC_` variable.

## 2. Required Vercel Environment Variables

Add these in Vercel -> Project -> Settings -> Environment Variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_rotated_service_role_key
```

Optional live AI:

```txt
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

If `GEMINI_API_KEY` is blank, Ask FitmentAI still works with the local MVP fallback.

## 3. Deploy To Vercel

1. Push the project to GitHub.
2. Import the GitHub repo into Vercel.
3. Add the environment variables above.
4. Deploy.

The normal Vercel build command can stay:

```txt
npm run build
```

## 4. Test The Live URL

On the Vercel URL, test:

1. Waitlist form saves to Supabase.
2. Create/sign in account.
3. Save a vehicle in My Garage.
4. Save a planned part.
5. Run a fitment check on the planned part.
6. Ask FitmentAI a question.

## 5. Run Security Policies

In Supabase SQL Editor, run:

```txt
security-rls-policies.sql
```

This enables Row Level Security for profiles, vehicles, planned parts, and waitlist inserts.

## 6. What Is Real Vs MVP

Real now:

- Supabase waitlist saves
- Supabase garage vehicle saves
- Supabase planned part saves
- Fitment score API
- Ask FitmentAI API route

MVP/mock until more data is connected:

- Live parts website search
- Verified community fitment database
- Exact manufacturer fitment matching
- Photo-based fitment analysis
