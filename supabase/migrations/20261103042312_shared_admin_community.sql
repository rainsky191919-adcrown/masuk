-- Additive shared backend. Requires the existing locations schema; never imports browser data.
begin;
create schema masuk_private;
revoke all on schema masuk_private from public, anon, authenticated;
grant usage on schema masuk_private to anon, authenticated;

create table masuk_private.roles (
  user_id uuid primary key references auth.users(id),
  role text not null check (role in ('admin','super_admin')),
  granted_at timestamptz not null default now()
);
create table masuk_private.audit (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, target text, reason text not null,
  created_at timestamptz not null default now()
);
create table masuk_private.posts (
  id uuid primary key default gen_random_uuid(), location_id text not null references public.locations(id),
  author_id uuid not null references auth.users(id), author text not null,
  type text not null check(type in ('提问','经验分享','规则变化')),
  title text not null check(length(btrim(title)) between 1 and 100),
  body text not null check(length(btrim(body)) between 1 and 3000),
  service text not null, visit_date date check(visit_date <= current_date),
  pinned boolean not null default false, hidden boolean not null default false,
  created_at timestamptz not null default now(), activity_at timestamptz not null default now()
);
create table masuk_private.replies (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references masuk_private.posts(id),
  author_id uuid not null references auth.users(id), author text not null,
  body text not null check(length(btrim(body)) between 1 and 1500),
  hidden boolean not null default false, created_at timestamptz not null default now()
);
create table masuk_private.helpful (
  post_id uuid not null references masuk_private.posts(id), user_id uuid not null references auth.users(id),
  primary key(post_id,user_id)
);
create table masuk_private.feedback (
  id uuid not null unique default gen_random_uuid(), hidden boolean not null default false,
  location_id text not null references public.locations(id), author_id uuid not null references auth.users(id),
  author text not null, level smallint not null check(level between 1 and 5),
  visited_at timestamptz not null check(visited_at <= now()), service text not null,
  note text not null check(length(note)<=1000), requirements jsonb not null,
  primary key(location_id,author_id)
);
create table masuk_private.reports (
  id uuid primary key default gen_random_uuid(), reporter uuid not null references auth.users(id),
  target_type text not null check(target_type in ('post','reply','location','feedback')),
  target text not null, reason text not null check(length(btrim(reason)) between 1 and 1000),
  status text not null default 'open' check(status in ('open','resolved','dismissed')),
  resolution text, resolver uuid references auth.users(id),
  created_at timestamptz not null default now(), resolved_at timestamptz,
  unique(reporter,target_type,target)
);
create table masuk_private.versions (
  location_id text not null references public.locations(id), number integer not null,
  data jsonb not null, author text not null, actor uuid references auth.users(id),
  reason text not null, created_at timestamptz not null default now(),
  primary key(location_id,number)
);
create table masuk_private.approvals (
  location_id text not null, number integer not null,
  user_id uuid not null references auth.users(id), name text not null, visit_date date check(visit_date<=current_date),
  created_at timestamptz not null default now(),
  foreign key(location_id,number) references masuk_private.versions(location_id,number),
  primary key(location_id,number,user_id)
);
alter table public.locations add column revision_number integer not null default 1;
alter table public.locations add column revision_reason text not null default '原有资料';
alter table public.locations add column review_needed boolean not null default false;
-- Seed history from existing cloud rows, not from local test/browser content.
insert into masuk_private.versions(location_id,number,data,author,reason,created_at)
select id,1,to_jsonb(l),last_modified_by,'原有资料',updated_at from public.locations l;

do $$ declare t text; begin
  foreach t in array array['roles','audit','posts','replies','helpful','feedback','reports','versions','approvals'] loop
    execute format('alter table masuk_private.%I enable row level security',t);
    execute format('revoke all on masuk_private.%I from public,anon,authenticated',t);
  end loop;
end $$;
revoke all on all sequences in schema masuk_private from public,anon,authenticated;
create index posts_location_idx on masuk_private.posts(location_id,created_at desc);
create index replies_post_idx on masuk_private.replies(post_id);
create index reports_status_idx on masuk_private.reports(status,created_at);

-- SECURITY DEFINER is narrowly required for atomic writes to private, non-exposed tables.
-- No browser role can access those tables directly. Every command below authenticates and
-- authorizes using auth.uid() and server-owned roles, never user_metadata/JWT role claims.
create function masuk_private.command(action text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); user_role text := 'user'; display_name text;
  target_id uuid; place_id text; reason text; result jsonb;
  p masuk_private.posts; r masuk_private.replies; loc public.locations; rep masuk_private.reports;
  expected integer; version integer; target_user uuid; desired text;
begin
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text)>30000 then
    raise exception 'INVALID_PAYLOAD' using errcode='22023';
  end if;
  if uid is not null then
    select coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Masuk 用户')
      into display_name from auth.users u where u.id=uid and u.email_confirmed_at is not null
      and not coalesce(u.is_anonymous,false) and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<now());
    if display_name is null then uid:=null; else
      select coalesce((select role from masuk_private.roles where user_id=uid),'user') into user_role;
    end if;
  end if;
  if action='role' then return jsonb_build_object('role',case when uid is null then 'guest' else user_role end); end if;

  if action='feed' then
    select jsonb_build_object('posts',coalesce(jsonb_agg(jsonb_build_object(
      'id',p0.id,'locationId',p0.location_id,'authorId',p0.author_id,'author',p0.author,
      'type',p0.type,'title',p0.title,'body',p0.body,'service',p0.service,'visitDate',p0.visit_date,
      'createdAt',p0.created_at,'activityAt',p0.activity_at,'pinned',p0.pinned,
      'helpful',coalesce((select jsonb_agg(h.user_id) from masuk_private.helpful h where h.post_id=p0.id),'[]'),
      'reports',case when exists(select 1 from masuk_private.reports x where x.reporter=uid and x.target_type='post' and x.target=p0.id::text) then jsonb_build_array(uid) else '[]'::jsonb end,
      'replies',coalesce((select jsonb_agg(jsonb_build_object('id',r0.id,'authorId',r0.author_id,'author',r0.author,'body',r0.body,'createdAt',r0.created_at) order by r0.created_at) from masuk_private.replies r0 where r0.post_id=p0.id and not r0.hidden),'[]')
    ) order by p0.activity_at desc),'[]'), 'feedback',
      coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'locationId',f.location_id,'authorId',f.author_id,'author',f.author,'level',f.level,'visitedAt',f.visited_at,'service',f.service,'note',f.note,'requirements',f.requirements)) from masuk_private.feedback f where not f.hidden),'[]'))
    into result from masuk_private.posts p0 where not p0.hidden;
    return result;
  end if;
  if action='locations' then
    select coalesce(jsonb_agg(to_jsonb(l) || jsonb_build_object('revision_id',l.revision_number::text,
      'accuracy_votes',coalesce((select jsonb_agg(jsonb_build_object('userId',a.user_id,'name',a.name,'visitDate',a.visit_date,'createdAt',a.created_at)) from masuk_private.approvals a where a.location_id=l.id and a.number=l.revision_number),'[]'),
      'revisions',coalesce((select jsonb_agg(jsonb_build_object('id',v.number::text,'number',v.number,'data',v.data || coalesce(v.data->'entry_requirements','{}'),'author',v.author,'createdAt',v.created_at,'reason',v.reason,
        'approvals',coalesce((select jsonb_agg(jsonb_build_object('userId',a.user_id,'name',a.name,'visitDate',a.visit_date,'createdAt',a.created_at)) from masuk_private.approvals a where a.location_id=v.location_id and a.number=v.number),'[]')) order by v.number) from masuk_private.versions v where v.location_id=l.id and v.number<l.revision_number),'[]')) order by l.updated_at desc),'[]')
    into result from public.locations l;
    return result;
  end if;

  if uid is null then raise exception 'LOGIN_REQUIRED' using errcode='42501'; end if;
  if action='admin' then
    if user_role not in ('admin','super_admin') then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
    return jsonb_build_object(
      'reports',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from masuk_private.reports x),'[]'),
      'posts',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from masuk_private.posts x),'[]'),
      'replies',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from masuk_private.replies x),'[]'),
      'feedback',coalesce((select jsonb_agg(to_jsonb(x) order by x.visited_at desc) from masuk_private.feedback x),'[]'),
      'audit',coalesce((select jsonb_agg(to_jsonb(x) order by x.id desc) from (select * from masuk_private.audit order by id desc limit 100) x),'[]'),
      'roles',case when user_role='super_admin' then coalesce((select jsonb_agg(jsonb_build_object('user_id',x.user_id,'role',x.role,'email',u.email)) from masuk_private.roles x join auth.users u on u.id=x.user_id),'[]') else '[]'::jsonb end);
  end if;

  if action='set_role' then
    if user_role<>'super_admin' then raise exception 'SUPER_ADMIN_REQUIRED' using errcode='42501'; end if;
    reason:=btrim(payload->>'reason'); desired:=payload->>'role';
    if coalesce(length(reason),0) not between 1 and 1000 or desired not in ('user','admin','super_admin') or desired is null then raise exception 'INVALID_ROLE_OR_REASON'; end if;
    -- All role changes serialize, including bootstrap. Recheck after acquiring lock.
    perform pg_advisory_xact_lock(716192011);
    if not exists(select 1 from masuk_private.roles where user_id=uid and role='super_admin') then raise exception 'SUPER_ADMIN_REQUIRED' using errcode='42501'; end if;
    select id into target_user from auth.users where lower(email)=lower(btrim(payload->>'email')) and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null;
    if target_user is null then raise exception 'VERIFIED_ACCOUNT_NOT_FOUND'; end if;
    if desired<>'super_admin' and exists(select 1 from masuk_private.roles where user_id=target_user and role='super_admin') and (select count(*) from masuk_private.roles where role='super_admin')<=1 then raise exception 'LAST_SUPER_ADMIN'; end if;
    if desired='user' then delete from masuk_private.roles where user_id=target_user;
    else insert into masuk_private.roles(user_id,role) values(target_user,desired) on conflict(user_id) do update set role=excluded.role; end if;
    insert into masuk_private.audit(actor,action,target,reason) values(uid,action,target_user::text,reason||' -> '||desired);
    return jsonb_build_object('ok',true);
  end if;

  if action='post' then
    place_id:=payload->>'locationId';
    insert into masuk_private.posts(location_id,author_id,author,type,title,body,service,visit_date)
      values(place_id,uid,left(display_name,150),payload->>'type',btrim(payload->>'title'),btrim(payload->>'body'),left(coalesce(payload->>'service','其他'),100),nullif(payload->>'visitDate','')::date) returning id into target_id;
  elsif action in ('reply','delete_post','delete_reply','helpful','pin','report','moderate') then
    reason:=btrim(payload->>'reason');
    if action='report' then
      if coalesce(length(reason),0) not between 1 and 1000 then raise exception 'REASON_REQUIRED'; end if;
      if payload->>'targetType'='post' then
        perform 1 from masuk_private.posts where id=(payload->>'id')::uuid and not hidden;
      elsif payload->>'targetType'='reply' then
        perform 1 from masuk_private.replies rr join masuk_private.posts pp on pp.id=rr.post_id where rr.id=(payload->>'id')::uuid and not rr.hidden and not pp.hidden;
      elsif payload->>'targetType'='location' then
        perform 1 from public.locations where id=payload->>'id';
      elsif payload->>'targetType'='feedback' then
        perform 1 from masuk_private.feedback where id=(payload->>'id')::uuid and not hidden;
      else raise exception 'INVALID_TARGET'; end if;
      if not found then raise exception 'TARGET_NOT_FOUND'; end if;
      insert into masuk_private.reports(reporter,target_type,target,reason) values(uid,payload->>'targetType',payload->>'id',reason)
        on conflict(reporter,target_type,target) do nothing;
      return jsonb_build_object('ok',true);
    end if;
    target_id:=(payload->>'id')::uuid;
    if action='moderate' then
      if user_role not in ('admin','super_admin') then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
      if coalesce(length(reason),0) not between 1 and 1000 then raise exception 'REASON_REQUIRED'; end if;
      if payload->>'targetType'='post' then
        update masuk_private.posts set hidden=(payload->>'hidden')::boolean where id=target_id;
      elsif payload->>'targetType'='reply' then
        update masuk_private.replies set hidden=(payload->>'hidden')::boolean where id=target_id;
      elsif payload->>'targetType'='feedback' then
        update masuk_private.feedback set hidden=(payload->>'hidden')::boolean where id=target_id;
      else raise exception 'INVALID_TARGET'; end if;
      if not found then raise exception 'TARGET_NOT_FOUND'; end if;
      insert into masuk_private.audit(actor,action,target,reason) values(uid,action,target_id::text,reason||' hidden='||(payload->>'hidden'));
      return jsonb_build_object('ok',true);
    end if;
    if action='delete_reply' then
      select * into r from masuk_private.replies where id=target_id for update;
      if not found or r.author_id<>uid then raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
      update masuk_private.replies set hidden=true where id=target_id;
    else
      select * into p from masuk_private.posts where id=target_id for update;
      if not found or p.hidden then raise exception 'POST_NOT_FOUND'; end if;
      if action='reply' then
        insert into masuk_private.replies(post_id,author_id,author,body) values(p.id,uid,left(display_name,150),btrim(payload->>'body'));
        update masuk_private.posts set activity_at=now() where id=p.id;
      elsif action='delete_post' then
        if p.author_id<>uid then raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
        update masuk_private.posts set hidden=true where id=p.id;
      elsif action='helpful' then
        if (payload->>'enabled')::boolean then insert into masuk_private.helpful values(p.id,uid) on conflict do nothing;
        else delete from masuk_private.helpful where post_id=p.id and user_id=uid; end if;
      elsif action='pin' then
        if user_role not in ('admin','super_admin') then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
        update masuk_private.posts set pinned=(payload->>'enabled')::boolean where id=p.id;
        insert into masuk_private.audit(actor,action,target,reason) values(uid,'pin',p.id::text,'pinned='||(payload->>'enabled'));
      end if;
    end if;
  elsif action='feedback' then
    insert into masuk_private.feedback(location_id,author_id,author,level,visited_at,service,note,requirements)
    values(payload->>'locationId',uid,left(display_name,150),(payload->>'level')::smallint,(payload->>'visitedAt')::timestamptz,left(payload->>'service',100),btrim(coalesce(payload->>'note','')),coalesce(payload->'requirements','{}'))
    on conflict(location_id,author_id) do update set author=excluded.author,level=excluded.level,visited_at=excluded.visited_at,service=excluded.service,note=excluded.note,requirements=excluded.requirements;
  elsif action='resolve_report' then
    if user_role not in ('admin','super_admin') then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
    reason:=btrim(payload->>'reason');
    if coalesce(length(reason),0) not between 1 and 1000 or coalesce(payload->>'status','') not in ('resolved','dismissed') then raise exception 'INVALID_RESOLUTION'; end if;
    select * into rep from masuk_private.reports where id=(payload->>'id')::uuid for update;
    if rep.id is null or rep.status<>'open' then raise exception 'REPORT_ALREADY_HANDLED'; end if;
    if coalesce((payload->>'hide')::boolean,false) then
      if payload->>'status'<>'resolved' then raise exception 'INVALID_RESOLUTION'; end if;
      if rep.target_type='post' then update masuk_private.posts set hidden=true where id=rep.target::uuid;
      elsif rep.target_type='reply' then update masuk_private.replies set hidden=true where id=rep.target::uuid;
      elsif rep.target_type='feedback' then update masuk_private.feedback set hidden=true where id=rep.target::uuid;
      else raise exception 'LOCATION_REPORT_REQUIRES_EDIT'; end if;
    end if;
    update masuk_private.reports set status=payload->>'status',resolution=btrim(payload->>'reason'),resolver=uid,resolved_at=now() where id=rep.id;
    insert into masuk_private.audit(actor,action,target,reason) values(uid,action,rep.id::text,reason||' status='||(payload->>'status')||' hide='||coalesce(payload->>'hide','false'));
  elsif action in ('save_location','approve','review_location') then
    place_id:=payload->>'id'; reason:=btrim(payload->>'reason');
    select * into loc from public.locations where id=place_id for update;
    if action='review_location' then
      if user_role not in ('admin','super_admin') then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
      if loc.id is null then raise exception 'LOCATION_NOT_FOUND'; end if;
      update public.locations set review_needed=(payload->>'enabled')::boolean where id=place_id;
      insert into masuk_private.audit(actor,action,target,reason) values(uid,action,place_id,'review='||(payload->>'enabled'));
    else
      expected:=(payload->>'expectedVersion')::integer;
      if loc.id is not null and (expected is null or loc.revision_number<>expected) then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
      if action='approve' then
        if loc.id is null then raise exception 'LOCATION_NOT_FOUND'; end if;
        if (payload->>'enabled')::boolean then
          insert into masuk_private.approvals(location_id,number,user_id,name,visit_date) values(place_id,loc.revision_number,uid,left(display_name,150),nullif(payload->>'visitDate','')::date) on conflict do nothing;
        else delete from masuk_private.approvals where location_id=place_id and number=loc.revision_number and user_id=uid; end if;
      else
        if coalesce(length(reason),0) not between 1 and 1000 then raise exception 'REASON_REQUIRED'; end if;
        if payload->>'maps_url' is not null and payload->>'maps_url' !~ '^https://(www[.])?google[.]com/maps/' then raise exception 'INVALID_MAP_URL'; end if;
        if jsonb_typeof(payload->'entry_requirements') is distinct from 'object' then raise exception 'INVALID_REQUIREMENTS'; end if;
        if loc.id is null and expected is not null then raise exception 'LOCATION_NOT_FOUND'; end if;
        version:=coalesce(loc.revision_number,0)+1;
        if length(btrim(payload->>'area')) not between 1 and 150 or length(btrim(payload->>'address')) not between 1 and 1000 or length(coalesce(payload->>'tips',''))>3000 then raise exception 'INVALID_LOCATION'; end if;
        if loc.id is null then
          insert into public.locations(id,name,area,address) values(place_id,btrim(payload->>'name'),btrim(payload->>'area'),btrim(payload->>'address'));
        end if;
        update public.locations set name=btrim(payload->>'name'),area=btrim(payload->>'area'),address=btrim(payload->>'address'),
          latitude=(payload->>'latitude')::double precision,longitude=(payload->>'longitude')::double precision,
          entrance_note=left(coalesce(payload->>'entrance_note',''),1000),entry_requirements=coalesce(payload->'entry_requirements','{}'),
          tips=coalesce(payload->>'tips',''),maps_url=payload->>'maps_url',
          revision_number=version,revision_reason=reason,last_modified_by=left(display_name,150),updated_at=now()
          where id=place_id returning * into loc;
        insert into masuk_private.versions(location_id,number,data,author,actor,reason) values(place_id,version,to_jsonb(loc),left(display_name,150),uid,reason);
        insert into masuk_private.audit(actor,action,target,reason) values(uid,action,place_id,reason);
      end if;
    end if;
  else raise exception 'UNKNOWN_ACTION' using errcode='22023'; end if;
  return jsonb_build_object('ok',true,'id',coalesce(target_id::text,place_id));
end $$;
revoke all on function masuk_private.command(text,jsonb) from public;
grant execute on function masuk_private.command(text,jsonb) to anon,authenticated;
create function public.masuk_command(action text,payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select masuk_private.command(action,payload);
$$;
revoke all on function public.masuk_command(text,jsonb) from public;
grant execute on function public.masuk_command(text,jsonb) to anon,authenticated;
commit;
