create table if not exists app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table app_data enable row level security;

drop policy if exists "app_data_select" on app_data;
drop policy if exists "app_data_insert" on app_data;
drop policy if exists "app_data_update" on app_data;

create policy "app_data_select"
on app_data for select
to anon
using (true);

create policy "app_data_insert"
on app_data for insert
to anon
with check (true);

create policy "app_data_update"
on app_data for update
to anon
using (true)
with check (true);

-- Stockage des documents lourds scannés (BC / BL / ticket température)
-- Le logiciel stocke les gros fichiers ici, puis garde seulement le lien dans app_data.
insert into storage.buckets (id, name, public)
values ('app-documents', 'app-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "app_documents_select" on storage.objects;
drop policy if exists "app_documents_insert" on storage.objects;
drop policy if exists "app_documents_update" on storage.objects;
drop policy if exists "app_documents_delete" on storage.objects;

create policy "app_documents_select"
on storage.objects for select
to anon
using (bucket_id = 'app-documents');

create policy "app_documents_insert"
on storage.objects for insert
to anon
with check (bucket_id = 'app-documents');

create policy "app_documents_update"
on storage.objects for update
to anon
using (bucket_id = 'app-documents')
with check (bucket_id = 'app-documents');

create policy "app_documents_delete"
on storage.objects for delete
to anon
using (bucket_id = 'app-documents');
