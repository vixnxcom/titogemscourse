# Quiz Content Guide

The complete quiz set for Weeks 1-6 is loaded by `0006_complete_six_week_quizzes.sql`. It includes 20 questions per week, the correct answer key, and feedback for Weeks 4-6. The migration enables a week only when every question has an answer key, so students cannot submit an ungraded quiz.

Answer keys use zero-based option indexes:

- A = 0
- B = 1
- C = 2
- D = 3

If a future quiz is added, run its answer updates in the Supabase SQL Editor:

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

The portal grades submissions on the server using these answer keys. A score of 70% or higher is required. A lower score is recorded as failed, and the student can retake the quiz. After submission, the student sees the score and question feedback without receiving the answer key before attempting the quiz. A later week stays locked until the previous week has a passed attempt and its seven-day unlock date has arrived.
