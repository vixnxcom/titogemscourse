# Backend Guide

This project uses Supabase as the backend and Paystack for payment.

The safest mental model:

- React shows the interface.
- Supabase stores students, payments, enrollments, quiz attempts, and material records.
- Supabase Edge Functions handle secrets and protected actions.
- Paystack confirms whether money was actually paid.

## 1. Supabase Keys

In your React `.env` file, only use public browser-safe values:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PAYSTACK_PUBLIC_KEY=...
```

Never put these in React:

```txt
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
```

Those go into Supabase Edge Function secrets only.

## 2. Database

Run this file in the Supabase SQL editor:

```txt
supabase/migrations/0001_course_platform.sql
```

Then run this content update:

```txt
supabase/migrations/0002_course_content_from_materials.sql
```

Then run the Google Drive video access update:

```txt
supabase/migrations/0003_google_drive_video_access.sql
```

It creates:

- `courses`
- `course_weeks`
- `materials`
- `quizzes`
- `quiz_questions`
- `enrollments`
- `payments`
- `quiz_attempts`

It also creates `is_week_unlocked(user_id, week_id)`, which checks:

- student has an active enrollment
- enough days have passed since `starts_at`
- previous week quiz was passed

## 3. Payments

The browser opens Paystack using the public key.

After Paystack returns a reference, React calls:

```txt
verify-paystack
```

That Edge Function verifies the transaction with the Paystack secret key. If the amount, currency, status, and email are correct, it creates or updates the student's enrollment.

## 4. Materials

PDFs should go into the private `course-materials` bucket. Example paths:

```txt
week-1/lesson.pdf
week-2/lesson.pdf
```

Videos should live outside Supabase Free Storage because video files can use bandwidth quickly. For the budget setup, use restricted Google Drive links and follow `docs/GOOGLE_DRIVE_VIDEO_SETUP.md`.

Students do not read storage paths directly. They call:

```txt
get-material-url
```

That function checks whether the week is unlocked, then returns either a signed PDF URL or the configured restricted Google Drive URL.

## 5. Quizzes

Quiz answers are stored in `quiz_questions.correct_option_index`.

Students do not fetch that column. They call:

```txt
get-quiz
```

That function returns only the question prompt and answer options.

When a student submits answers, React calls:

```txt
submit-quiz
```

The function grades the attempt on the server and writes the score to `quiz_attempts`.

## 6. Changing the Course Length

To add or remove weeks, update both:

- `src/lib/coursePlan.js`
- `supabase/migrations/0001_course_platform.sql`

Keep the `course_weeks.id` values in React and Supabase matching. Those IDs are how the frontend asks the backend about a specific week.

## 7. Recommended Launch Checklist

- Create one test student account.
- Run Paystack in test mode.
- Confirm payment creates an enrollment.
- Confirm Week 1 opens after payment.
- Confirm Week 2 stays locked until 7 days have passed and Week 1 quiz is passed.
- Upload one real PDF and confirm the signed URL opens.
- Add one real video URL and confirm it opens only for an unlocked week.
- Try a failed quiz and confirm the next week stays locked.
