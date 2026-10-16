-- Run once in the Supabase SQL editor (after schema.sql).
create table bank_accounts(user_id uuid primary key references profiles, bank_code text not null, bank_name text,
  account_number text not null, account_name text not null, recipient_code text not null);
create table payouts(commission_id uuid primary key references commissions, doer uuid references profiles,
  amount int not null, fee int not null, ref text unique not null, status text not null default 'pending' check(status in('pending','sent','failed')));
alter table bank_accounts enable row level security; alter table payouts enable row level security;
create policy "own" on bank_accounts for select using(user_id=auth.uid());
create policy "own" on payouts for select using(doer=auth.uid());

-- doers must have a bank account before they can accept or take a task
create or replace function respond(cid uuid, accept bool) returns void language plpgsql security definer set search_path=public as $$
declare c commissions;
begin
  select * into c from commissions where id=cid for update;
  if c.doer is distinct from auth.uid() or c.status<>'awaiting' then raise exception 'Not allowed'; end if;
  if accept and not exists(select 1 from bank_accounts where user_id=auth.uid()) then raise exception 'Add your bank account on the Account page first'; end if;
  if accept then update commissions set status='accepted' where id=cid; perform notify_members(cid,'Commission accepted. Chat is open.');
  else
    update commissions set status='declined' where id=cid;
    update contributions set status='refund_due' where commission_id=cid and status='paid';
    delete from messages where commission_id=cid;
    insert into notifications(user_id,commission_id,body) select user_id,cid,'Commission declined. You will be refunded.' from contributions where commission_id=cid;
  end if;
end $$;

create or replace function take_task(cid uuid) returns void language plpgsql security definer set search_path=public as $$
declare c commissions;
begin
  select * into c from commissions where id=cid for update;
  if c.status<>'open' or c.requester=auth.uid() or exists(select 1 from contributions where commission_id=cid and user_id=auth.uid())
    then raise exception 'Not allowed'; end if;
  if not exists(select 1 from bank_accounts where user_id=auth.uid()) then raise exception 'Add your bank account on the Account page first'; end if;
  update commissions set doer=auth.uid(), status='accepted' where id=cid;
  perform notify_members(cid,'Someone took your task. Chat is open.');
end $$;
