update public.course_weeks
set
  title = values.title,
  summary = values.summary
from (
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Identity and Self Discovery', 'Clarify who you are, what shapes your identity, and how strengths and weaknesses affect growth.'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Mindset Reset', 'Identify limiting beliefs, challenge old patterns, and begin reprogramming your mind with action.'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Vision and SMART Goals', 'Define a clear vision, connect it to your values, and translate it into specific goals.'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'Discipline and Daily Habits', 'Build discipline through small routines, habit stacking, progress tracking, and consistency.'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Confidence and Action', 'Overcome fear, stop waiting for perfect confidence, and turn clarity into steady action.'),
    ('66666666-6666-6666-6666-666666666666'::uuid, 'Personal Brand and Life System', 'Build a deliberate personal brand and organize priorities, goals, habits, and routines into a life system.')
) as values(id, title, summary)
where public.course_weeks.id = values.id;

update public.materials
set title = values.title
from (
  values
    ('m-week-1-pdf', 'Identity and Self Discovery Guide'),
    ('m-week-1-video', 'Identity and Self Discovery Video'),
    ('m-week-2-pdf', 'Mindset Reset Guide'),
    ('m-week-2-video', 'Mindset Reset Video'),
    ('m-week-3-pdf', 'Vision and SMART Goals Guide'),
    ('m-week-3-video', 'Vision and SMART Goals Video'),
    ('m-week-4-pdf', 'Discipline and Habits Guide'),
    ('m-week-4-video', 'Discipline and Habits Video'),
    ('m-week-5-pdf', 'Confidence and Action Guide'),
    ('m-week-5-video', 'Confidence and Action Video'),
    ('m-week-6-pdf', 'Personal Brand and Life System Guide'),
    ('m-week-6-video', 'Personal Brand and Life System Video')
) as values(id, title)
where public.materials.id = values.id;

insert into public.quiz_questions (id, quiz_id, prompt, options, correct_option_index, explanation, sort_order)
values
  ('q-week-1-1', 'quiz-week-1', 'According to Week 1, what can eventually become your reality?', '["Your identity", "Your phone model", "Your browser history", "Your password"]'::jsonb, 0, null, 1),
  ('q-week-1-2', 'quiz-week-1', 'What is an important part of self discovery?', '["Ignoring weaknesses", "Understanding strengths and weaknesses", "Avoiding feedback", "Copying everyone else"]'::jsonb, 1, null, 2),
  ('q-week-2-1', 'quiz-week-2', 'What are limiting beliefs?', '["Beliefs that constrain progress and achievement", "A list of weekly videos", "A payment receipt", "A type of quiz score"]'::jsonb, 0, null, 1),
  ('q-week-2-2', 'quiz-week-2', 'What helps reprogram the mind?', '["Awareness, repetition, and action", "Waiting forever", "Avoiding small steps", "Only wishing"]'::jsonb, 0, null, 2),
  ('q-week-3-1', 'quiz-week-3', 'What does a clear vision help you do?', '["Make better decisions", "Avoid all responsibility", "Remove all deadlines", "Stop learning"]'::jsonb, 0, null, 1),
  ('q-week-3-2', 'quiz-week-3', 'What does the S in SMART goals stand for?', '["Specific", "Silent", "Simple only", "Sudden"]'::jsonb, 0, null, 2),
  ('q-week-4-1', 'quiz-week-4', 'How is discipline developed?', '["Through consistent habits, systems, actions, and mindset", "Only by motivation", "By avoiding goals", "By waiting for pressure"]'::jsonb, 0, null, 1),
  ('q-week-4-2', 'quiz-week-4', 'What does habit stacking mean?', '["Connecting a new habit to an existing routine", "Starting every goal too big", "Quitting after one missed day", "Ignoring progress"]'::jsonb, 0, null, 2),
  ('q-week-5-1', 'quiz-week-5', 'What is courage described as?', '["Acting wisely despite fear", "Never feeling fear", "Avoiding action", "Waiting for perfect confidence"]'::jsonb, 0, null, 1),
  ('q-week-5-2', 'quiz-week-5', 'What is the bridge between ideas and results?', '["Taking action", "Overthinking", "Perfectionism", "Delay"]'::jsonb, 0, null, 2),
  ('q-week-6-1', 'quiz-week-6', 'What is a personal brand?', '["The reputation, identity, and impression people associate with you", "Only a logo", "Only a slogan", "A private password"]'::jsonb, 0, null, 1),
  ('q-week-6-2', 'quiz-week-6', 'What do systems help you do?', '["Keep moving consistently", "Avoid priorities", "Remove all routines", "Depend only on motivation"]'::jsonb, 0, null, 2)
on conflict (id) do update set
  prompt = excluded.prompt,
  options = excluded.options,
  correct_option_index = excluded.correct_option_index,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order;
