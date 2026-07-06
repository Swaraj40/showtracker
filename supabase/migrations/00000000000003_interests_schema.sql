create table item_interests (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id integer not null,
  item_type text not null, -- 'movie' or 'show'
  interest text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure a user can only vote once per item
alter table item_interests add constraint item_interests_unique_user_item unique (user_id, item_id, item_type);

-- Create index for faster querying by item
create index idx_item_interests_item on item_interests(item_id, item_type);

-- RLS policies
alter table item_interests enable row level security;

create policy "Users can view all interests"
  on item_interests for select
  to public
  using (true);

create policy "Users can insert their own interests"
  on item_interests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own interests"
  on item_interests for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own interests"
  on item_interests for delete
  to authenticated
  using (auth.uid() = user_id);
