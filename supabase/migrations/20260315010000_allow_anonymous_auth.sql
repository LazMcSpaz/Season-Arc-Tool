-- Allow anonymous authenticated users (passcode-gated access)
-- Supabase anonymous sign-in creates sessions with role = 'anon'
-- but they are still authenticated users with a valid JWT.
-- Update RLS policies to allow any user with a valid JWT.

drop policy if exists "Authenticated users have full access to project" on project;
drop policy if exists "Authenticated users have full access to thread" on thread;
drop policy if exists "Authenticated users have full access to episode" on episode;
drop policy if exists "Authenticated users have full access to arc_cell" on arc_cell;
drop policy if exists "Authenticated users have full access to beat" on beat;
drop policy if exists "Authenticated users have full access to character" on character;
drop policy if exists "Authenticated users have full access to beat_character" on beat_character;
drop policy if exists "Authenticated users have full access to character_note" on character_note;

create policy "All authenticated users have full access" on project
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on thread
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on episode
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on arc_cell
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on beat
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on character
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on beat_character
  for all using (auth.uid() is not null);

create policy "All authenticated users have full access" on character_note
  for all using (auth.uid() is not null);
