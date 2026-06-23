# Course Materials Map

Source files in `C:\Users\vixnd\Downloads\TitoGems`:

- `COURSE PRESENTATIONS.pptx`
- `Gmail - Fwd_ COURSE VIDEOS AND PRESENTATIONS.pdf`

The PowerPoint contains 27 slides. I mapped those slides into six weekly modules:

| Week | Module | Slides |
| --- | --- | --- |
| 1 | Identity and Self Discovery | 1-2 |
| 2 | Mindset Reset | 3-4 |
| 3 | Vision and SMART Goals | 5-8 |
| 4 | Discipline and Daily Habits | 9-11 |
| 5 | Confidence and Action | 12-17 |
| 6 | Personal Brand and Life System | 18-27 |

## Recommended Supabase Storage Paths

Upload weekly PDFs into the private `course-materials` bucket using these paths:

| Week | PDF storage path |
| --- | --- |
| 1 | `week-1/lesson.pdf` |
| 2 | `week-2/lesson.pdf` |
| 3 | `week-3/lesson.pdf` |
| 4 | `week-4/lesson.pdf` |
| 5 | `week-5/lesson.pdf` |
| 6 | `week-6/lesson.pdf` |

The database already points to those PDF paths.

## Video Links

The forwarded Gmail PDF did not expose searchable text or clickable PDF links during extraction. If it contains video links visually, open it manually and copy each video URL.

Then update the `materials.external_url` values in Supabase. For the budget Google Drive setup, keep every Drive file or folder set to `Restricted`.

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

For paid content, avoid putting videos inside React `public`. Do not set Google Drive videos to `Anyone with the link`.
