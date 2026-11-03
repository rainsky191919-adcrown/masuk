create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth to anon,authenticated;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,deleted_at timestamptz,banned_until timestamptz,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant execute on function auth.uid() to anon,authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('00000000-0000-0000-0000-000000000001','rainsky191919@gmail.com',now(),'{"full_name":"Owner"}'),
('00000000-0000-0000-0000-000000000002','rider@example.test',now(),'{"full_name":"Rider","role":"super_admin"}'),
('00000000-0000-0000-0000-000000000003','other@example.test',now(),'{"full_name":"Other"}'),
('00000000-0000-0000-0000-000000000004','moderator@example.test',now(),'{"full_name":"Moderator"}'),
('00000000-0000-0000-0000-000000000005','unverified@example.test',null,'{}');
