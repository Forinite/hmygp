-- Run once. Lets owners edit or delete a post while nobody has bought lots.
alter table listings add column deleted bool not null default false;
alter table payments add column created_at timestamptz default now();

-- locked = someone has bought lots (paid/released), a deal is active/finished, or a payment started in the last 45 minutes
create function listing_locked(lid uuid) returns bool language sql stable security definer set search_path=public as $$
  select exists(select 1 from commissions c where c.listing_id=lid and (
    c.status in('awaiting','accepted','open','done')
    or exists(select 1 from contributions k where k.commission_id=c.id and k.status in('paid','released'))
    or exists(select 1 from payments p where p.commission_id=c.id and p.status='pending' and p.created_at>now()-interval '45 minutes'))) $$;

create function edit_listing(p_id uuid, p_title text, p_price int, p_lots int default null) returns void
language plpgsql security definer set search_path=public as $$
declare l listings; n int;
begin
  select * into l from listings where id=p_id and owner=auth.uid() and not deleted for update;
  if not found then raise exception 'Post not found'; end if;
  if listing_locked(p_id) then raise exception 'Someone has bought lots, so this can no longer be edited'; end if;
  if char_length(p_title) not between 5 and 200 or p_price<100 then raise exception 'Check the title (5+ characters) and price (₦100+)'; end if;
  update listings set title=p_title, price=p_price where id=p_id;
  update commissions c set price=p_price, total_lots=coalesce(case when l.kind='request' and p_lots is not null then greatest(1,least(p_lots,50)) end, c.total_lots),
    note=case when l.kind='request' then p_title else c.note end where c.listing_id=p_id and c.status='funding';
  update commissions set lot_price=ceil(price::numeric/total_lots) where listing_id=p_id and status='funding';
end $$;

create function delete_listing(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from listings where id=p_id and owner=auth.uid() and not deleted) then raise exception 'Post not found'; end if;
  if listing_locked(p_id) then raise exception 'Someone has bought lots, so this can no longer be deleted'; end if;
  update listings set deleted=true where id=p_id;
  update commissions set status='cancelled' where listing_id=p_id and status='funding';
end $$;

-- hide deleted posts everywhere
drop view feed; drop view lot_status;
create view lot_status as select c.id commission_id, c.listing_id, l.title, l.kind, c.price, c.total_lots, c.lot_price,
  paid_lots(c.id) lots_paid, c.status, c.requester from commissions c join listings l on l.id=c.listing_id where not l.deleted;
create view feed as select l.*, p.name owner_name, s.commission_id, s.total_lots, s.lots_paid, s.status
  from listings l join profiles p on p.id=l.owner
  left join lot_status s on s.listing_id=l.id and l.kind='request'
  where not l.deleted and (l.kind='offer' or (s.lots_paid>0 and s.status in('funding','open')));
grant select on lot_status, feed to anon, authenticated;
drop policy "r" on listings;
create policy "r" on listings for select using(not deleted or owner=auth.uid());

-- no new commissions on deleted offers
create or replace function create_commission(p_listing uuid, p_note text, p_lots int default 1) returns uuid
language plpgsql security definer set search_path=public as $$
declare li listings; c uuid; n int := greatest(1,least(coalesce(p_lots,1),50));
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into li from listings where id=p_listing and kind='offer' and not deleted;
  if not found then raise exception 'Offer not found'; end if;
  if li.owner=auth.uid() then raise exception 'You cannot commission yourself'; end if;
  insert into commissions(listing_id,requester,doer,note,price,total_lots,lot_price)
  values(p_listing,auth.uid(),li.owner,p_note,li.price,n,ceil(li.price::numeric/n)) returning id into c;
  return c;
end $$;
