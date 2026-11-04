-- Read-only paged API. Does not alter content, existing command/RLS or permissions.
begin;
create index if not exists posts_visible_activity_idx on masuk_private.posts(location_id,pinned desc,activity_at desc,id) where not hidden;
create index if not exists replies_visible_order_idx on masuk_private.replies(post_id,created_at,id) where not hidden;
create or replace function masuk_private.discussion(action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  requested integer; current_page integer; total bigint; pages integer; result jsonb; counts jsonb;
  place text := payload->>'locationId'; kind text := coalesce(payload->>'type','全部'); ordering text := coalesce(payload->>'sort','latest');
  target_post_id uuid; uid uuid := auth.uid();
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>30000 then raise exception 'INVALID_PAYLOAD' using errcode='22023'; end if;
  if action='overview' then
    return jsonb_build_object('posts','[]'::jsonb,
      'postCounts',coalesce((select jsonb_object_agg(x.location_id,x.n) from (select location_id,count(*) n from masuk_private.posts where not hidden group by location_id) x),'{}'),
      'discussionVersion',(select md5(coalesce(jsonb_agg(jsonb_build_array(p.id,p.activity_at,p.pinned,p.hidden,
        (select count(*) from masuk_private.replies r where r.post_id=p.id and not r.hidden),
        (select count(*) from masuk_private.helpful h where h.post_id=p.id)) order by p.id)::text,'')) from masuk_private.posts p),
      'feedback',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'locationId',f.location_id,'authorId',f.author_id,'author',f.author,'level',f.level,'visitedAt',f.visited_at,'service',f.service,'note',f.note,'requirements',f.requirements)) from masuk_private.feedback f where not f.hidden),'[]'));
  end if;
  if coalesce(payload->>'page','1') !~ '^[0-9]{1,10}$' or coalesce((payload->>'page')::bigint,1) not between 1 and 2147483647 then raise exception 'INVALID_PAGE' using errcode='22023'; end if;
  requested := coalesce((payload->>'page')::integer,1);
  if action='posts' then
    if kind not in ('全部','提问','经验分享','规则变化') or ordering not in ('latest','helpful') or place is null then raise exception 'INVALID_FILTER' using errcode='22023'; end if;
    select count(*) into total from masuk_private.posts p where not p.hidden and p.location_id=place and (kind='全部' or p.type=kind);
    select jsonb_build_object('全部',count(*),'提问',count(*) filter(where p.type='提问'),'经验分享',count(*) filter(where p.type='经验分享'),'规则变化',count(*) filter(where p.type='规则变化')) into counts from masuk_private.posts p where not p.hidden and p.location_id=place;
    pages := greatest(1,ceil(total/10.0)::integer); current_page := least(requested,pages);
    if payload->>'focusId' is not null then
      select coalesce(((x.n-1)/10+1)::integer,current_page) into current_page from (
        select p.id,row_number() over(order by p.pinned desc,case when ordering='helpful' then (select count(*) from masuk_private.helpful h where h.post_id=p.id) else 0 end desc,p.activity_at desc,p.id) n
        from masuk_private.posts p where not p.hidden and p.location_id=place and (kind='全部' or p.type=kind)
      ) x where x.id::text=payload->>'focusId';
      current_page:=coalesce(current_page,1);
    end if;
    select coalesce(jsonb_agg(x.item order by x.pinned desc,x.hcount desc,x.activity_at desc,x.id),'[]') into result from (
      select p.id,p.pinned,p.activity_at,case when ordering='helpful' then (select count(*) from masuk_private.helpful h where h.post_id=p.id) else 0 end hcount,
        jsonb_build_object('id',p.id,'locationId',p.location_id,'authorId',p.author_id,'author',p.author,'type',p.type,'title',p.title,'body',p.body,'service',p.service,'visitDate',p.visit_date,'createdAt',p.created_at,'activityAt',p.activity_at,'pinned',p.pinned,
          'helpfulCount',(select count(*) from masuk_private.helpful h where h.post_id=p.id),
          'helpful',case when exists(select 1 from masuk_private.helpful h where h.post_id=p.id and h.user_id=uid) then jsonb_build_array(uid) else '[]'::jsonb end,
          'reports',case when exists(select 1 from masuk_private.reports r where r.target_type='post' and r.target=p.id::text and r.reporter=uid) then jsonb_build_array(uid) else '[]'::jsonb end,
          'replyCount',(select count(*) from masuk_private.replies r where r.post_id=p.id and not r.hidden)) item
      from masuk_private.posts p where not p.hidden and p.location_id=place and (kind='全部' or p.type=kind)
      order by p.pinned desc,hcount desc,p.activity_at desc,p.id limit 10 offset ((current_page::bigint-1)*10)
    ) x;
    return jsonb_build_object('items',result,'total',total,'page',current_page,'pages',pages,'counts',counts);
  elsif action='replies' then
    if coalesce(payload->>'sort','oldest') not in ('oldest','latest') then raise exception 'INVALID_SORT' using errcode='22023'; end if;
    target_post_id:=(payload->>'postId')::uuid;
    if not exists(select 1 from masuk_private.posts p where p.id=target_post_id and not p.hidden) then raise exception 'TARGET_NOT_FOUND' using errcode='22023'; end if;
    select count(*) into total from masuk_private.replies r where r.post_id=target_post_id and not r.hidden;
    pages:=greatest(1,ceil(total/10.0)::integer);current_page:=least(requested,pages);
    -- After a write locate this caller's newest matching reply, even if others
    -- have already appended enough replies to fill another page.
    if payload->>'focusOwnBody' is not null and uid is not null then
      select ((x.n-1)/10+1)::integer into current_page from (
        select r.id,r.body,r.author_id,r.created_at,row_number() over(order by case when payload->>'sort'='latest' then r.created_at end desc, case when payload->>'sort'='latest' then r.id end desc, r.created_at, r.id) n
        from masuk_private.replies r where r.post_id=target_post_id and not r.hidden
      ) x where x.author_id=uid and x.body=payload->>'focusOwnBody' order by x.created_at desc,x.id desc limit 1;
      current_page:=coalesce(current_page,pages);
    end if;
    select coalesce(jsonb_agg(x.item order by case when payload->>'sort'='latest' then x.created_at end desc, case when payload->>'sort'='latest' then x.id end desc, x.created_at, x.id),'[]') into result from (
      select r.id,r.created_at,jsonb_build_object('id',r.id,'authorId',r.author_id,'author',r.author,'body',r.body,'createdAt',r.created_at) item
      from masuk_private.replies r where r.post_id=target_post_id and not r.hidden order by case when payload->>'sort'='latest' then r.created_at end desc, case when payload->>'sort'='latest' then r.id end desc, r.created_at, r.id limit 10 offset ((current_page::bigint-1)*10)
    ) x;
    return jsonb_build_object('items',result,'total',total,'page',current_page,'pages',pages);
  end if;
  raise exception 'UNKNOWN_ACTION' using errcode='22023';
end $$;
revoke all on function masuk_private.discussion(text,jsonb) from public;
grant execute on function masuk_private.discussion(text,jsonb) to anon,authenticated;
create or replace function public.masuk_discussion(action text,payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$select masuk_private.discussion(action,payload)$$;
revoke all on function public.masuk_discussion(text,jsonb) from public;
grant execute on function public.masuk_discussion(text,jsonb) to anon,authenticated;
commit;
