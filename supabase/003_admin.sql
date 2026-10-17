-- Run once. Then make yourself admin (use your login email):
alter table profiles add column is_admin bool not null default false;
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'obefortune2@gmail.com');
