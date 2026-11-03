-- Execute separately on the confirmed environment only, after QA/release gates.
-- Never creates identities or trusts a user-editable claim. Missing verified account aborts.
begin;
do $$ declare target_user uuid; matches integer; begin
  perform pg_advisory_xact_lock(716192011);
  select count(*) into matches from auth.users where lower(email)='rainsky191919@gmail.com'
    and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null;
  if matches<>1 then raise exception 'Exactly one verified rainsky191919@gmail.com account is required'; end if;
  select id into target_user from auth.users where lower(email)='rainsky191919@gmail.com'
    and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null;
  if exists(select 1 from masuk_private.roles where role='super_admin' and user_id<>target_user) then
    raise exception 'Existing other super admin: inspect before bootstrapping';
  end if;
  insert into masuk_private.roles(user_id,role) values(target_user,'super_admin') on conflict(user_id) do update set role='super_admin';
  insert into masuk_private.audit(actor,action,target,reason) values(null,'bootstrap_super_admin',target_user::text,'Explicit owner instruction 2026-11-03');
end $$;
commit;
