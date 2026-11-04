-- Test-only stand-ins for Supabase's built-in roles and auth schema.
-- Never run this file against a hosted project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  is_anonymous boolean default true,
  created_at timestamptz default now(),
  last_sign_in_at timestamptz,
  email text,
  phone text
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
