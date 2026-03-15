-- ============================================================
-- RemantContinent StoryManager — Initial Schema
-- Based on Design Document v1.0, Section 7: Data Model
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Project: top-level container for all story data
create table project (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Thread: a story thread shared across all episodes in a project
-- e.g. Flatwind, Dambar/Plains, Supernatural Undercurrent
create table thread (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  color text not null default '#1A3A5C',
  sort_order integer not null default 0
);

-- Episode: a single episode within a project
create table episode (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references project(id) on delete cascade,
  number integer not null,
  title text not null default '',
  thematic_link text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Arc Cell: one cell in the Season Arc Grid (episode × thread intersection)
create table arc_cell (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references episode(id) on delete cascade,
  thread_id uuid not null references thread(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (episode_id, thread_id)
);

-- Beat: an individual story beat within a thread in an episode
create table beat (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references episode(id) on delete cascade,
  thread_id uuid not null references thread(id) on delete cascade,
  label text not null default 'Beat' check (label in ('Opening', 'Beat', 'Climax', 'Closing')),
  text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Character: a character in the project with an arc summary
create table character (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  color text not null default '#8B4513',
  arc_summary text not null default ''
);

-- Beat_Character: join table linking beats to tagged characters
create table beat_character (
  beat_id uuid not null references beat(id) on delete cascade,
  character_id uuid not null references character(id) on delete cascade,
  primary key (beat_id, character_id)
);

-- Character Note: per-character note on a specific beat
-- Written in Character View, displayed in Episode View continuity panel
create table character_note (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid not null references character(id) on delete cascade,
  beat_id uuid not null references beat(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (character_id, beat_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_thread_project on thread(project_id);
create index idx_episode_project on episode(project_id);
create index idx_episode_number on episode(project_id, number);
create index idx_arc_cell_episode on arc_cell(episode_id);
create index idx_arc_cell_thread on arc_cell(thread_id);
create index idx_beat_episode on beat(episode_id);
create index idx_beat_thread on beat(thread_id);
create index idx_beat_sort on beat(episode_id, thread_id, sort_order);
create index idx_character_project on character(project_id);
create index idx_beat_character_beat on beat_character(beat_id);
create index idx_beat_character_character on beat_character(character_id);
create index idx_character_note_character on character_note(character_id);
create index idx_character_note_beat on character_note(beat_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_project_updated_at
  before update on project
  for each row execute function update_updated_at();

create trigger trg_arc_cell_updated_at
  before update on arc_cell
  for each row execute function update_updated_at();

create trigger trg_character_note_updated_at
  before update on character_note
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- All tables require auth; all authenticated users have full access (v1)
-- ============================================================

alter table project enable row level security;
alter table thread enable row level security;
alter table episode enable row level security;
alter table arc_cell enable row level security;
alter table beat enable row level security;
alter table character enable row level security;
alter table beat_character enable row level security;
alter table character_note enable row level security;

-- v1: all authenticated users have full access (no permission tiers)
create policy "Authenticated users have full access to project"
  on project for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to thread"
  on thread for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to episode"
  on episode for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to arc_cell"
  on arc_cell for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to beat"
  on beat for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to character"
  on character for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to beat_character"
  on beat_character for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to character_note"
  on character_note for all using (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- Enable Supabase Realtime on all tables for live sync (Section 8)
-- ============================================================

alter publication supabase_realtime add table project;
alter publication supabase_realtime add table thread;
alter publication supabase_realtime add table episode;
alter publication supabase_realtime add table arc_cell;
alter publication supabase_realtime add table beat;
alter publication supabase_realtime add table character;
alter publication supabase_realtime add table beat_character;
alter publication supabase_realtime add table character_note;
