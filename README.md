# TitoGems Course Platform

Vite + React starter for a paid weekly course portal.

It includes:

- Supabase Auth for student login
- Paystack inline payment with server-side transaction verification
- Weekly content locks that open every 7 days
- Quiz gating before the next week opens
- Private material access through Supabase Edge Functions
- Demo mode when Supabase keys are not configured yet

## Local Setup

Install Node.js 22 or newer from <https://nodejs.org>, then run:

```powershell
cd "C:\Users\vixnd\Downloads\TitoGems\titogems-course-platform"
npm install
npm run dev
```

Create `.env` from `.env.example` and add your real Supabase and Paystack public keys.

## Supabase Setup

1. Create a Supabase project on the Free plan.
2. Open the SQL editor.
3. Run `supabase/migrations/0001_course_platform.sql`.
4. Run `supabase/migrations/0002_course_content_from_materials.sql`.
5. Run `supabase/migrations/0003_google_drive_video_access.sql`.
6. In Authentication settings, enable email login. Magic link is the easiest start.
7. Upload PDFs to the private `course-materials` bucket created by the migration.
8. Use paths like `week-1/lesson.pdf`.
9. Update the `materials` table with the real `storage_path` or `external_url`.

For a slower backend walkthrough, read `docs/BACKEND_GUIDE.md`.
For the current course-material mapping, read `docs/MATERIALS_MAP.md`.
For restricted Google Drive videos, read `docs/GOOGLE_DRIVE_VIDEO_SETUP.md`.

## Supabase Edge Function Secrets

Set these secrets in Supabase before deploying functions:

```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_secret_key
npx supabase secrets set COURSE_ID=00000000-0000-0000-0000-000000000001
npx supabase secrets set COURSE_PRICE_KOBO=500000
npx supabase secrets set COURSE_CURRENCY=NGN
```

Deploy the functions:

```powershell
npx supabase functions deploy verify-paystack
npx supabase functions deploy get-material-url
npx supabase functions deploy get-quiz
npx supabase functions deploy submit-quiz
```

## Important Production Notes

- Keep `PAYSTACK_SECRET_KEY` only in Supabase secrets. Never put it in `.env`.
- Store videos outside Supabase Free Storage if files are large. This project supports restricted Google Drive links for the budget setup.
- Supabase should be the source of truth for enrollment, quiz passing, and material access. The React app only displays the result.
- For the first live paid cohort, test Paystack with a real small transaction before selling broadly.
