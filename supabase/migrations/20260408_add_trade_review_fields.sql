alter table public.trades
add column if not exists adherence_score integer,
add column if not exists confidence_score integer,
add column if not exists emotion text,
add column if not exists lesson_learned text,
add column if not exists review_completed boolean default false;

alter table public.trades
drop constraint if exists trades_adherence_score_check;

alter table public.trades
add constraint trades_adherence_score_check
check (adherence_score is null or adherence_score between 1 and 5);

alter table public.trades
drop constraint if exists trades_confidence_score_check;

alter table public.trades
add constraint trades_confidence_score_check
check (confidence_score is null or confidence_score between 1 and 5);
