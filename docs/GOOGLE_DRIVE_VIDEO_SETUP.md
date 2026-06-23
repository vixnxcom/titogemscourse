# Google Drive Video Setup

This is the low-cost video setup for the course.

It is not full DRM. It protects against casual link sharing by combining:

- paid login on the course website
- weekly unlocks and quiz gating in Supabase
- Google Drive `Restricted` sharing
- manually granting video access to each paid student's Google email

## 1. Prepare the Videos

Compress the videos first. For slide-based lessons, 720p or 1080p H.264 is usually enough.

Create a Google Drive folder structure like this:

```txt
TitoGems Course Videos
  Week 1 - Identity and Self Discovery
  Week 2 - Mindset Reset
  Week 3 - Vision and SMART Goals
  Week 4 - Discipline and Daily Habits
  Week 5 - Confidence and Action
  Week 6 - Personal Brand and Life System
```

Set each folder or video to:

```txt
General access: Restricted
Role for students: Viewer
```

If you do not want downloads, open the sharing settings and disable viewer download/print/copy.

If downloads are allowed, students can share the downloaded file. The website cannot prevent that after the file leaves Google Drive.

## 2. Save the Student's Google Email

The app has a `Video access` panel on the student dashboard.

Students should enter the Google email they want to use for restricted videos.

You can view those emails in Supabase SQL Editor:

```sql
select
  u.email as login_email,
  p.google_email,
  e.status,
  e.paid_at
from public.profiles p
join auth.users u on u.id = p.id
left join public.enrollments e on e.user_id = p.id
order by e.paid_at desc nulls last;
```

Use `p.google_email` when sharing the Google Drive video folders.

## 3. Add Drive Links To Supabase

For each video, copy the Google Drive file or folder link after setting it to `Restricted`.

Then update the matching material row.

```sql
update public.materials
set
  external_url = 'PASTE_WEEK_1_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 1 video access.',
  allow_download = false
where id = 'm-week-1-video';

update public.materials
set
  external_url = 'PASTE_WEEK_2_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 2 video access.',
  allow_download = false
where id = 'm-week-2-video';

update public.materials
set
  external_url = 'PASTE_WEEK_3_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 3 video access.',
  allow_download = false
where id = 'm-week-3-video';

update public.materials
set
  external_url = 'PASTE_WEEK_4_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 4 video access.',
  allow_download = false
where id = 'm-week-4-video';

update public.materials
set
  external_url = 'PASTE_WEEK_5_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 5 video access.',
  allow_download = false
where id = 'm-week-5-video';

update public.materials
set
  external_url = 'PASTE_WEEK_6_RESTRICTED_GOOGLE_DRIVE_LINK',
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has Week 6 video access.',
  allow_download = false
where id = 'm-week-6-video';
```

If you intentionally allow downloads, change `allow_download = true` in your records and enable downloads in Google Drive. Keep the course notice clear because the downloaded file can still be shared.

## 4. What The Website Protects

The website only reveals each Drive link after:

- the student is logged in
- payment/enrollment is active
- the week is unlocked by date
- previous required quiz has been passed

Google Drive then checks whether the viewer's Google account has permission.

Do not set videos to `Anyone with the link`.
