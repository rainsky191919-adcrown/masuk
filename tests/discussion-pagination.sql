begin;
create function public.discussion_assert(ok boolean, message text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',message; end if;end$$;
grant execute on function public.discussion_assert(boolean,text) to anon,authenticated;
do $$declare n integer; response jsonb; result jsonb; pid uuid; begin
  foreach n in array array[0,1,10,11,20,21] loop
    delete from masuk_private.replies; delete from masuk_private.posts;
    insert into masuk_private.posts(id,location_id,author_id,author,type,title,body,service,pinned,created_at,activity_at)
      select md5(i::text)::uuid,'skudai-001','00000000-0000-0000-0000-000000000002','Local rider',case when i%2=0 then '提问' else '经验分享' end,'Local post '||i,'Local body','外卖配送',i<=11,now(),now() from generate_series(1,n) i;
    response:=public.masuk_discussion('posts','{"locationId":"skudai-001","page":1}');
    perform public.discussion_assert(jsonb_array_length(response->'items')=least(n,10),'post boundary '||n);
    perform public.discussion_assert((response->>'pages')::integer=greatest(1,ceil(n/10.0)::integer),'post pages '||n);
    result:=public.masuk_discussion('posts','{"locationId":"skudai-001","page":2147483647}');
    perform public.discussion_assert((result->>'page')::integer=greatest(1,ceil(n/10.0)::integer),'clamp page '||n);
  end loop;
  response:=public.masuk_discussion('posts','{"locationId":"skudai-001","type":"提问"}');
  perform public.discussion_assert((response->>'total')::int=10 and (response->'counts'->>'全部')::int=21,'filtered count and overall count');
  perform public.discussion_assert(not ((response->'items'->0) ? 'replies'),'post page omits reply bodies');
  result:=public.masuk_discussion('posts','{"locationId":"skudai-002"}');
  perform public.discussion_assert((result->>'total')::int=0,'other location does not receive these posts');
  response:=public.masuk_discussion('posts','{"locationId":"skudai-001","page":1}');
  result:=public.masuk_discussion('posts','{"locationId":"skudai-001","page":2}');
  perform public.discussion_assert(not exists(select 1 from jsonb_array_elements(response->'items') a join jsonb_array_elements(result->'items') b on a->>'id'=b->>'id'),'tied timestamps and pinned ranks do not duplicate across pages');
  pid:=md5('21')::uuid;
  response:=public.masuk_discussion('posts',jsonb_build_object('locationId','skudai-001','focusId',pid));
  perform public.discussion_assert((response->>'page')::int>1 and exists(select 1 from jsonb_array_elements(response->'items') p where p->>'id'=pid::text),'focus new post behind pinned posts');
  foreach n in array array[0,1,10,11,20,21] loop
    delete from masuk_private.replies;
    insert into masuk_private.replies(id,post_id,author_id,author,body,created_at)
      select md5(('reply'||i)::text)::uuid,pid,'00000000-0000-0000-0000-000000000002','Local rider','Reply '||i,now()+i*interval '1 second' from generate_series(1,n) i;
    response:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'page',1));
    perform public.discussion_assert(jsonb_array_length(response->'items')=least(n,10),'reply boundary '||n);
    result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'page',2147483647));
    perform public.discussion_assert((result->>'page')::int=greatest(1,ceil(n/10.0)::integer),'reply last page '||n);
    if n=11 then perform public.discussion_assert(jsonb_array_length(result->'items')=1 and result->'items'->0->>'body'='Reply 11','eleventh reply chronological second page'); end if;
  end loop;
  result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'sort','latest','page',1));
  perform public.discussion_assert(jsonb_array_length(result->'items')=10 and result->'items'->0->>'body'='Reply 21' and result->'items'->9->>'body'='Reply 12','latest first page globally descending');
  result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'sort','latest','page',3));
  perform public.discussion_assert(jsonb_array_length(result->'items')=1 and result->'items'->0->>'body'='Reply 1','latest final page oldest remaining reply');
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'sort','latest','focusOwnBody','Reply 21'));
  perform public.discussion_assert((result->>'page')::int=1,'latest saved reply focus on newest first page');
  perform set_config('request.jwt.claim.sub','',true);
  update masuk_private.replies set hidden=true where body='Reply 21';
  result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'page',3));
  perform public.discussion_assert((result->>'page')::int=2 and (result->>'total')::int=20,'hidden reply excluded and invalid final page clamped');
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  result:=public.masuk_discussion('replies',jsonb_build_object('postId',pid,'page',2147483647,'focusOwnBody','Reply 1'));
  perform public.discussion_assert((result->>'page')::int=1,'locate own reply even after concurrent later replies');
  perform set_config('request.jwt.claim.sub','',true);
  update masuk_private.posts set hidden=true where id=pid;
  response:=public.masuk_discussion('overview');
  perform public.discussion_assert(response->'posts'='[]' and (response->'postCounts'->>'skudai-001')::int=20,'overview returns counts not post bodies');
end$$;
set local role anon;
select public.discussion_assert(jsonb_array_length(public.masuk_discussion('posts','{"locationId":"skudai-001"}')->'items')=10,'anon can read bounded visible page');
select public.discussion_assert(not has_table_privilege('anon','masuk_private.posts','SELECT'),'no new direct table access');
select public.discussion_assert(not has_function_privilege('public','public.masuk_discussion(text,jsonb)','EXECUTE'),'no PUBLIC function execution');
do $$begin
  begin perform public.masuk_discussion('replies',jsonb_build_object('postId',md5('21')::uuid));raise exception 'hidden parent visible'; exception when invalid_parameter_value then null; end;
  begin perform public.masuk_discussion('delete_post','{}');raise exception 'write action accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.masuk_discussion('posts','{"locationId":"skudai-001","page":0}');raise exception 'invalid page accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.masuk_discussion('replies',jsonb_build_object('postId',md5('21')::uuid,'sort','invalid'));raise exception 'invalid sort accepted'; exception when invalid_parameter_value then null; end;
end$$;
reset role;
rollback;
select 'PASS: discussion SQL boundaries, permissions, hidden content, independent counts and stable focus';
