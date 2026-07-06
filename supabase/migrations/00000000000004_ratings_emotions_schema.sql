create table item_ratings (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id integer not null,
  item_type text not null, -- 'movie' or 'show'
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table item_ratings add constraint item_ratings_unique_user_item unique (user_id, item_id, item_type);
create index idx_item_ratings_item on item_ratings(item_id, item_type);

alter table item_ratings enable row level security;

create policy "Users can view all ratings" on item_ratings for select to public using (true);
create policy "Users can insert their own ratings" on item_ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own ratings" on item_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own ratings" on item_ratings for delete to authenticated using (auth.uid() = user_id);


create table item_emotions (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id integer not null,
  item_type text not null, -- 'movie' or 'show'
  emotion text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table item_emotions add constraint item_emotions_unique_user_item unique (user_id, item_id, item_type);
create index idx_item_emotions_item on item_emotions(item_id, item_type);

alter table item_emotions enable row level security;

create policy "Users can view all emotions" on item_emotions for select to public using (true);
create policy "Users can insert their own emotions" on item_emotions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own emotions" on item_emotions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own emotions" on item_emotions for delete to authenticated using (auth.uid() = user_id);
