# Activity submissions

Students complete each weekly activity outside the portal, then upload one PDF, Word document, JPG, or PNG file from the matching week card.

The upload is stored in the private `activity-submissions` bucket. A server-side Supabase function then emails the document to the course team. The test recipient defaults to `alexxie.abrams@gmail.com`.

## One-time Supabase setup

Run these commands from the project folder after signing in to Supabase:

```powershell
npx supabase@latest db push
npx supabase@latest secrets set RESEND_API_KEY=re_your_key_here ACTIVITY_RECIPIENT_EMAIL=alexxie.abrams@gmail.com ACTIVITY_FROM_EMAIL="TitoGems Course <onboarding@resend.dev>"
npx supabase@latest functions deploy notify-activity-upload
```

`RESEND_API_KEY` is required for delivery. Create it in Resend and keep it as a Supabase secret; never add it to `.env` or React code. The `onboarding@resend.dev` sender is for testing. For production, use a verified sender address from the client's domain.

If the email secret has not been configured yet, uploads still remain safely stored in Supabase and the student sees that email delivery is pending.

Week 2 and later remain locked until the previous week's activity has been uploaded and its quiz has been passed. Week 1 is available immediately after enrollment.
