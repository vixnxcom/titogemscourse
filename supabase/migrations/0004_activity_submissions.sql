insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-submissions',
  'activity-submissions',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.activity_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  course_week_id uuid not null references public.course_weeks (id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  file_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint not null default 0 check (file_size >= 0),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, week_number)
);

create index if not exists activity_submissions_user_course_idx
on public.activity_submissions (user_id, course_id);

alter table public.activity_submissions enable row level security;

drop policy if exists "Users can read own activity submissions" on public.activity_submissions;
create policy "Users can read own activity submissions"
on public.activity_submissions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own activity submissions" on public.activity_submissions;
create policy "Users can create own activity submissions"
on public.activity_submissions for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.enrollments e
    where e.user_id = auth.uid()
      and e.course_id = activity_submissions.course_id
      and e.status = 'active'
  )
  and exists (
    select 1
    from public.course_weeks cw
    where cw.id = activity_submissions.course_week_id
      and cw.course_id = activity_submissions.course_id
      and cw.week_number = activity_submissions.week_number
  )
);

drop policy if exists "Users can update own activity submissions" on public.activity_submissions;
create policy "Users can update own activity submissions"
on public.activity_submissions for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.enrollments e
    where e.user_id = auth.uid()
      and e.course_id = activity_submissions.course_id
      and e.status = 'active'
  )
);

drop policy if exists "Users can upload own activity files" on storage.objects;
create policy "Users can upload own activity files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'activity-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own activity files" on storage.objects;
create policy "Users can read own activity files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'activity-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.is_week_unlocked(p_user_id uuid, p_week_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_week public.course_weeks%rowtype;
  active_enrollment public.enrollments%rowtype;
  previous_quiz_passed boolean;
  previous_activity_submitted boolean;
begin
  select *
  into target_week
  from public.course_weeks
  where id = p_week_id;

  if target_week.id is null then
    return false;
  end if;

  select *
  into active_enrollment
  from public.enrollments
  where user_id = p_user_id
    and course_id = target_week.course_id
    and status = 'active';

  if active_enrollment.id is null then
    return false;
  end if;

  if active_enrollment.starts_at + make_interval(days => target_week.unlock_after_days) > now() then
    return false;
  end if;

  if target_week.week_number = 1 then
    return true;
  end if;

  select exists (
    select 1
    from public.quiz_attempts qa
    where qa.user_id = p_user_id
      and qa.course_id = target_week.course_id
      and qa.week_number = target_week.week_number - 1
      and qa.passed = true
  )
  into previous_quiz_passed;

  select exists (
    select 1
    from public.activity_submissions activity
    where activity.user_id = p_user_id
      and activity.course_id = target_week.course_id
      and activity.week_number = target_week.week_number - 1
  )
  into previous_activity_submitted;

  return coalesce(previous_quiz_passed, false)
    and coalesce(previous_activity_submitted, false);
end;
$$;

grant execute on function public.is_week_unlocked(uuid, uuid) to authenticated;
