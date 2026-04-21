-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  share_id text unique not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Tickets table
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  position integer not null default 0,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_projects_share_id on public.projects(share_id);
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_tickets_project_id on public.tickets(project_id);
create index if not exists idx_tickets_status on public.tickets(project_id, status);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.tickets enable row level security;

-- Projects RLS policies
create policy "Anyone can view projects"
  on public.projects for select
  using (true);

create policy "Anyone can create projects"
  on public.projects for insert
  with check (true);

create policy "Owners can update their projects"
  on public.projects for update
  using (owner_id = auth.uid() or owner_id is null);

create policy "Owners can delete their projects"
  on public.projects for delete
  using (owner_id = auth.uid() or owner_id is null);

-- Tickets RLS policies (fully open — anyone with the link can manage tickets)
create policy "Anyone can view tickets"
  on public.tickets for select
  using (true);

create policy "Anyone can create tickets"
  on public.tickets for insert
  with check (true);

create policy "Anyone can update tickets"
  on public.tickets for update
  using (true);

create policy "Anyone can delete tickets"
  on public.tickets for delete
  using (true);

-- Enable realtime for tickets
alter publication supabase_realtime add table public.tickets;

-- Storage bucket for ticket images
insert into storage.buckets (id, name, public)
values ('ticket-images', 'ticket-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can upload ticket images"
  on storage.objects for insert
  with check (bucket_id = 'ticket-images');

create policy "Anyone can view ticket images"
  on storage.objects for select
  using (bucket_id = 'ticket-images');

create policy "Anyone can delete ticket images"
  on storage.objects for delete
  using (bucket_id = 'ticket-images');
