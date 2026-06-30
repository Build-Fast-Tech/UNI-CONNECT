-- The /entry-test upload form writes categories (past_paper, lecture, mcqs,
-- book) that were never added to notes_category_check, so every entry-test
-- upload failed the constraint. Widen it to include them (additive — only
-- permits more values, never tightens).
alter table public.notes drop constraint if exists notes_category_check;
alter table public.notes add constraint notes_category_check
  check (category in (
    'notes','quiz','assignment','sessional1','sessional2','final','textbook','other',
    'past_paper','lecture','mcqs','book'
  ));

-- Entry-test prep books are large (NAT / mock-test PDFs ~100 MB). Raise the
-- notes bucket limit from 50 MB to 110 MB so they can be stored.
update storage.buckets set file_size_limit = 115343360 where id = 'notes';
