create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  price_kobo integer not null check (price_kobo > 0),
  currency text not null default 'NGN',
  passing_score integer not null default 70 check (passing_score between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.course_weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  title text not null,
  summary text not null,
  unlock_after_days integer not null check (unlock_after_days >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, week_number)
);

create table if not exists public.materials (
  id text primary key,
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  kind text not null check (kind in ('pdf', 'video')),
  title text not null,
  storage_path text,
  external_url text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id text primary key,
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  passing_score integer not null default 70 check (passing_score between 1 and 100),
  created_at timestamptz not null default now(),
  unique (course_week_id)
);

create table if not exists public.quiz_questions (
  id text primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_option_index integer not null check (correct_option_index >= 0),
  explanation text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled', 'refunded')),
  paid_at timestamptz not null default now(),
  starts_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null check (status in ('success', 'failed', 'abandoned', 'reversed')),
  provider_response jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_week_id uuid not null references public.course_weeks(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  score_percent numeric(5,2) not null check (score_percent between 0 and 100),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_course_idx
  on public.quiz_attempts (user_id, course_id, week_number, created_at desc);

create index if not exists enrollments_user_course_idx
  on public.enrollments (user_id, course_id);

insert into public.courses (id, slug, title, price_kobo, currency, passing_score)
values (
  '00000000-0000-0000-0000-000000000001',
  'titogems-core',
  'TitoGems Course',
  500000,
  'NGN',
  70
)
on conflict (id) do update set
  title = excluded.title,
  price_kobo = excluded.price_kobo,
  currency = excluded.currency,
  passing_score = excluded.passing_score;

insert into public.course_weeks (id, course_id, week_number, title, summary, unlock_after_days)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 1, 'Course Foundations', 'Orientation, expected outcomes, and the first core learning path.', 0),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 2, 'Core Concepts', 'Build the vocabulary and repeatable habits needed for the course.', 7),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 3, 'Applied Practice', 'Put the course ideas into guided exercises and small assignments.', 14),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 4, 'Delivery Workflow', 'Learn the step-by-step workflow for producing reliable results.', 21),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 5, 'Review and Quality', 'Check your work, refine weak spots, and prepare for the final week.', 28),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 6, 'Final Application', 'Complete the final course exercise and lock in the full process.', 35)
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  unlock_after_days = excluded.unlock_after_days;

insert into public.materials (id, course_week_id, kind, title, storage_path, external_url, sort_order)
values
  ('m-week-1-pdf', '11111111-1111-1111-1111-111111111111', 'pdf', 'Week 1 PDF Guide', 'week-1/lesson.pdf', null, 1),
  ('m-week-1-video', '11111111-1111-1111-1111-111111111111', 'video', 'Week 1 Video Lesson', null, null, 2),
  ('m-week-2-pdf', '22222222-2222-2222-2222-222222222222', 'pdf', 'Week 2 PDF Guide', 'week-2/lesson.pdf', null, 1),
  ('m-week-2-video', '22222222-2222-2222-2222-222222222222', 'video', 'Week 2 Video Lesson', null, null, 2),
  ('m-week-3-pdf', '33333333-3333-3333-3333-333333333333', 'pdf', 'Week 3 PDF Guide', 'week-3/lesson.pdf', null, 1),
  ('m-week-3-video', '33333333-3333-3333-3333-333333333333', 'video', 'Week 3 Video Lesson', null, null, 2),
  ('m-week-4-pdf', '44444444-4444-4444-4444-444444444444', 'pdf', 'Week 4 PDF Guide', 'week-4/lesson.pdf', null, 1),
  ('m-week-4-video', '44444444-4444-4444-4444-444444444444', 'video', 'Week 4 Video Lesson', null, null, 2),
  ('m-week-5-pdf', '55555555-5555-5555-5555-555555555555', 'pdf', 'Week 5 PDF Guide', 'week-5/lesson.pdf', null, 1),
  ('m-week-5-video', '55555555-5555-5555-5555-555555555555', 'video', 'Week 5 Video Lesson', null, null, 2),
  ('m-week-6-pdf', '66666666-6666-6666-6666-666666666666', 'pdf', 'Week 6 PDF Guide', 'week-6/lesson.pdf', null, 1),
  ('m-week-6-video', '66666666-6666-6666-6666-666666666666', 'video', 'Week 6 Video Lesson', null, null, 2)
on conflict (id) do update set
  title = excluded.title,
  storage_path = excluded.storage_path,
  external_url = excluded.external_url,
  sort_order = excluded.sort_order;

insert into public.quizzes (id, course_week_id, passing_score)
values
  ('quiz-week-1', '11111111-1111-1111-1111-111111111111', 70),
  ('quiz-week-2', '22222222-2222-2222-2222-222222222222', 70),
  ('quiz-week-3', '33333333-3333-3333-3333-333333333333', 70),
  ('quiz-week-4', '44444444-4444-4444-4444-444444444444', 70),
  ('quiz-week-5', '55555555-5555-5555-5555-555555555555', 70),
  ('quiz-week-6', '66666666-6666-6666-6666-666666666666', 70)
on conflict (id) do nothing;

insert into public.quiz_questions (id, quiz_id, prompt, options, correct_option_index, explanation, sort_order)
values
  ('q-week-1-1', 'quiz-week-1', 'What must happen before a student can move to the next week?', '["They must pass the current week quiz", "They must refresh the browser", "They must download every file", "They must create a new account"]'::jsonb, 0, null, 1),
  ('q-week-1-2', 'quiz-week-1', 'How often do new weekly materials unlock?', '["Every day", "Every 7 days", "Every 30 days", "All at once"]'::jsonb, 1, null, 2),
  ('q-week-2-1', 'quiz-week-2', 'Which part should be trusted for paid-course access decisions?', '["The browser only", "Supabase or server-side checks", "CSS", "A screenshot"]'::jsonb, 1, null, 1),
  ('q-week-2-2', 'quiz-week-2', 'Where should the Paystack secret key live?', '["In React", "In a public PDF", "In Supabase function secrets", "In the page title"]'::jsonb, 2, null, 2),
  ('q-week-3-1', 'quiz-week-3', 'Why should course PDFs use private or signed links?', '["To protect paid materials", "To make fonts bigger", "To avoid quizzes", "To remove login"]'::jsonb, 0, null, 1),
  ('q-week-3-2', 'quiz-week-3', 'What should unlock Week 3?', '["Payment only", "Time plus Week 2 quiz pass", "A new browser tab", "Public links"]'::jsonb, 1, null, 2),
  ('q-week-4-1', 'quiz-week-4', 'What is the safest source of truth for quiz attempts?', '["Local storage", "The database", "A button color", "A downloaded file"]'::jsonb, 1, null, 1),
  ('q-week-4-2', 'quiz-week-4', 'What should happen after a failed quiz attempt?', '["Let the student retry", "Delete their account", "Skip all locks", "Hide Week 1"]'::jsonb, 0, null, 2),
  ('q-week-5-1', 'quiz-week-5', 'What is one reason to keep videos outside Supabase Free Storage?', '["Video files can use storage and bandwidth quickly", "Supabase cannot store text", "Paystack requires it", "React cannot play videos"]'::jsonb, 0, null, 1),
  ('q-week-5-2', 'quiz-week-5', 'Who should be able to read a student quiz attempt?', '["Only that student and trusted server code", "Every visitor", "Anonymous users", "Search engines"]'::jsonb, 0, null, 2),
  ('q-week-6-1', 'quiz-week-6', 'What should be tested before launching a paid course?', '["Login, payment, unlocks, materials, and quiz passing", "Only the home page color", "Only the logo", "Nothing"]'::jsonb, 0, null, 1),
  ('q-week-6-2', 'quiz-week-6', 'When can a student access a future week?', '["When both timing and quiz requirements are met", "Before paying", "Whenever they guess the URL", "Only on Mondays"]'::jsonb, 0, null, 2)
on conflict (id) do update set
  prompt = excluded.prompt,
  options = excluded.options,
  correct_option_index = excluded.correct_option_index,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order;

insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', false)
on conflict (id) do update set public = false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

  return coalesce(previous_quiz_passed, false);
end;
$$;

grant execute on function public.is_week_unlocked(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_weeks enable row level security;
alter table public.materials enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read active courses" on public.courses;
create policy "Authenticated users can read active courses"
on public.courses for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated users can read week outlines" on public.course_weeks;
create policy "Authenticated users can read week outlines"
on public.course_weeks for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_weeks.course_id
      and c.is_active = true
  )
);

drop policy if exists "Users can read own enrollments" on public.enrollments;
create policy "Users can read own enrollments"
on public.enrollments for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
on public.payments for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own quiz attempts" on public.quiz_attempts;
create policy "Users can read own quiz attempts"
on public.quiz_attempts for select
to authenticated
using (auth.uid() = user_id);

-- Materials and quiz answers are intentionally not readable by browser clients.
-- The Edge Functions read them with the service role key after checking access.
