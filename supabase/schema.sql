-- Run in Supabase SQL editor. Money is held by you (escrow) until both sides confirm.
create table profiles(id uuid primary key references auth.users on delete cascade, name text not null default 'Anon');
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,name) values(new.id, coalesce(new.raw_user_meta_data->>'name','Anon')); return new; end $$;
create trigger on_auth_user after insert on auth.users for each row execute function handle_new_user();

create table listings(id uuid primary key default gen_random_uuid(), owner uuid not null references profiles,
  kind text not null check(kind in('offer','request')), title text not null check(char_length(title) between 5 and 200),
  price int not null check(price>=100), created_at timestamptz default now());
create table commissions(id uuid primary key default gen_random_uuid(), listing_id uuid references listings,
  requester uuid not null references profiles, doer uuid references profiles, note text,
  price int not null, total_lots int not null default 1 check(total_lots between 1 and 50), lot_price int not null,
  status text not null default 'funding' check(status in('funding','awaiting','open','accepted','done','declined','cancelled')),
  requester_done bool default false, doer_done bool default false, created_at timestamptz default now());
create table payments(ref text primary key, commission_id uuid references commissions, user_id uuid references profiles,
  lots int not null, amount int not null, provider text, status text default 'pending');
create table contributions(id uuid primary key default gen_random_uuid(), commission_id uuid references commissions,
  user_id uuid references profiles, lots int not null, payment_ref text,
  status text default 'paid' check(status in('paid','refund_due','refunded','released')));
create table messages(id bigint generated always as identity primary key, commission_id uuid references commissions on delete cascade,
  sender uuid references profiles default auth.uid(), body text check(char_length(body) between 1 and 2000), created_at timestamptz default now());
create table notifications(id bigint generated always as identity primary key, user_id uuid references profiles,
  commission_id uuid references commissions, body text, read bool default false, created_at timestamptz default now());

create function paid_lots(c uuid) returns int language sql stable security definer set search_path=public as
$$ select coalesce(sum(lots),0)::int from contributions where commission_id=c and status='paid' $$;
create function is_member(c uuid) returns bool language sql stable security definer set search_path=public as
$$ select exists(select 1 from commissions where id=c and (requester=auth.uid() or (doer=auth.uid() and status<>'funding')))
   or exists(select 1 from contributions where commission_id=c and user_id=auth.uid() and status='paid') $$;

-- public view: everyone can see lots paid, never the private note
create view lot_status as select c.id commission_id, c.listing_id, l.title, l.kind, c.price, c.total_lots, c.lot_price,
  paid_lots(c.id) lots_paid, c.status, c.requester from commissions c join listings l on l.id=c.listing_id;
create view feed as select l.*, p.name owner_name, s.commission_id, s.total_lots, s.lots_paid, s.status
  from listings l join profiles p on p.id=l.owner
  left join lot_status s on s.listing_id=l.id and l.kind='request'
  where l.kind='offer' or (s.lots_paid>0 and s.status in('funding','open'));
grant select on lot_status, feed to anon, authenticated;

alter table profiles enable row level security; alter table listings enable row level security;
alter table commissions enable row level security; alter table payments enable row level security;
alter table contributions enable row level security; alter table messages enable row level security;
alter table notifications enable row level security;
create policy "r" on profiles for select using(true);
create policy "r" on listings for select using(true);
create policy "r" on commissions for select using(is_member(id));
create policy "r" on contributions for select using(user_id=auth.uid());
create policy "r" on messages for select using(is_member(commission_id));
create policy "w" on messages for insert with check(sender=auth.uid() and is_member(commission_id)
  and exists(select 1 from commissions where id=commission_id and status='accepted'));
create policy "r" on notifications for select using(user_id=auth.uid());
create policy "u" on notifications for update using(user_id=auth.uid());
alter publication supabase_realtime add table messages;

create function notify_members(cid uuid, txt text) returns void language sql security definer set search_path=public as $$
  insert into notifications(user_id,commission_id,body)
  select distinct u, cid, txt from (select requester u from commissions where id=cid union select doer from commissions where id=cid
   union select user_id from contributions where commission_id=cid and status='paid') t where u is not null and u<>coalesce(auth.uid(),'00000000-0000-0000-0000-000000000000') $$;

create function settle(cid uuid) returns void language plpgsql security definer set search_path=public as $$
declare c commissions; is_full bool;
begin
  select * into c from commissions where id=cid; is_full := paid_lots(cid)>=c.total_lots;
  if is_full and c.status='funding' then
    if c.doer is not null then
      update commissions set status='awaiting' where id=cid;
      insert into notifications(user_id,commission_id,body) values(c.doer,cid,'Someone paid for your service. Accept or decline.');
    else update commissions set status='open' where id=cid; end if;
  elsif not is_full and c.status in('awaiting','open') then update commissions set status='funding' where id=cid; end if;
end $$;

create function create_listing(p_kind text, p_title text, p_price int, p_lots int default 1) returns jsonb
language plpgsql security definer set search_path=public as $$
declare l uuid; c uuid; n int := case when p_kind='request' then greatest(1,least(coalesce(p_lots,1),50)) else 1 end;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into listings(owner,kind,title,price) values(auth.uid(),p_kind,p_title,p_price) returning id into l;
  if p_kind='request' then
    insert into commissions(listing_id,requester,note,price,total_lots,lot_price)
    values(l,auth.uid(),p_title,p_price,n,ceil(p_price::numeric/n)) returning id into c;
  end if;
  return jsonb_build_object('listing_id',l,'commission_id',c);
end $$;

create function create_commission(p_listing uuid, p_note text, p_lots int default 1) returns uuid
language plpgsql security definer set search_path=public as $$
declare li listings; c uuid; n int := greatest(1,least(coalesce(p_lots,1),50));
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into li from listings where id=p_listing and kind='offer';
  if not found then raise exception 'Offer not found'; end if;
  if li.owner=auth.uid() then raise exception 'You cannot commission yourself'; end if;
  insert into commissions(listing_id,requester,doer,note,price,total_lots,lot_price)
  values(p_listing,auth.uid(),li.owner,p_note,li.price,n,ceil(li.price::numeric/n)) returning id into c;
  return c;
end $$;

-- called only by the server after a verified payment
create function record_payment(p_ref text) returns void language plpgsql security definer set search_path=public as $$
declare p payments; c commissions;
begin
  select * into p from payments where ref=p_ref for update;
  if not found or p.status<>'pending' then return; end if;
  select * into c from commissions where id=p.commission_id for update;
  if c.status not in('funding','awaiting','open') or p.lots>c.total_lots-paid_lots(c.id) then
    update payments set status='refund_due' where ref=p_ref; return; end if;
  update payments set status='success' where ref=p_ref;
  insert into contributions(commission_id,user_id,lots,payment_ref) values(c.id,p.user_id,p.lots,p_ref);
  perform settle(c.id);
end $$;

create function refund_my_lots(cid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from commissions where id=cid and status in('funding','awaiting','open')) then raise exception 'Already accepted'; end if;
  update contributions set status='refund_due' where commission_id=cid and user_id=auth.uid() and status='paid';
  if not found then raise exception 'You have no lots here'; end if;
  perform settle(cid);
end $$;

create function respond(cid uuid, accept bool) returns void language plpgsql security definer set search_path=public as $$
declare c commissions;
begin
  select * into c from commissions where id=cid for update;
  if c.doer is distinct from auth.uid() or c.status<>'awaiting' then raise exception 'Not allowed'; end if;
  if accept then update commissions set status='accepted' where id=cid; perform notify_members(cid,'Commission accepted. Chat is open.');
  else
    update commissions set status='declined' where id=cid;
    update contributions set status='refund_due' where commission_id=cid and status='paid';
    delete from messages where commission_id=cid;
    insert into notifications(user_id,commission_id,body) select user_id,cid,'Commission declined. You will be refunded.' from contributions where commission_id=cid;
  end if;
end $$;

create function take_task(cid uuid) returns void language plpgsql security definer set search_path=public as $$
declare c commissions;
begin
  select * into c from commissions where id=cid for update;
  if c.status<>'open' or c.requester=auth.uid() or exists(select 1 from contributions where commission_id=cid and user_id=auth.uid())
    then raise exception 'Not allowed'; end if;
  update commissions set doer=auth.uid(), status='accepted' where id=cid;
  perform notify_members(cid,'Someone took your task. Chat is open.');
end $$;

create function cancel_task(cid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from commissions where id=cid and doer=auth.uid() and status='accepted') then raise exception 'Not allowed'; end if;
  perform notify_members(cid,'The task was cancelled. You will be refunded.');
  update commissions set status='cancelled' where id=cid;
  update contributions set status='refund_due' where commission_id=cid and status='paid';
  delete from messages where commission_id=cid;
end $$;

create function confirm_done(cid uuid) returns void language plpgsql security definer set search_path=public as $$
declare c commissions;
begin
  select * into c from commissions where id=cid for update;
  if c.status<>'accepted' then raise exception 'Not active'; end if;
  if c.requester=auth.uid() then update commissions set requester_done=true where id=cid;
  elsif c.doer=auth.uid() then update commissions set doer_done=true where id=cid;
  else raise exception 'Not allowed'; end if;
  if (select requester_done and doer_done from commissions where id=cid) then
    update commissions set status='done' where id=cid;
    update contributions set status='released' where commission_id=cid and status='paid';
    delete from messages where commission_id=cid;
    perform notify_members(cid,'Marked done by both sides. Chat closed.');
  end if;
end $$;

revoke all on function record_payment(text), settle(uuid), notify_members(uuid,text) from public, anon, authenticated;
