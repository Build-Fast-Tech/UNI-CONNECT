alter table notes drop constraint if exists notes_category_check;
alter table notes add constraint notes_category_check
  check (category in ('notes','quiz','assignment','sessional1','sessional2','final','textbook','other'));

update notes set category = 'sessional1' where category = 'sessional';
