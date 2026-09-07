# Quiz Content Guide

The course quiz questions for Weeks 1-3 are stored in Supabase. Each question currently has a blank answer key, so those quizzes cannot be submitted yet. This prevents a student from passing an ungraded quiz.

When the answer key is ready, convert each answer choice to its zero-based option index:

- A = 0
- B = 1
- C = 2
- D = 3

Run the answer updates in the Supabase SQL Editor. Replace the example IDs and indexes with the supplied answer key:

```sql
update public.quiz_questions
set correct_option_index = case id
  when 'q-week-1-1' then 0
  when 'q-week-1-2' then 1
  when 'q-week-1-3' then 3
  else correct_option_index
end
where quiz_id = 'quiz-week-1';
```

After all questions in that week have been checked, enable the quiz:

```sql
update public.quizzes q
set is_available = (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.quiz_id = q.id
  )
  and not exists (
    select 1
    from public.quiz_questions qq
    where qq.quiz_id = q.id
      and qq.correct_option_index is null
  )
)
where q.id = 'quiz-week-1';
```

The portal grades submissions on the server using these answer keys. A score of 70% or higher is required. A lower score is recorded as failed, and the student can retake the quiz. A later week stays locked until the previous week has a passed attempt and its seven-day unlock date has arrived.
