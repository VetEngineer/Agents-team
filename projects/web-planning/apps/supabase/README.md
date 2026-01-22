# Supabase Migrations

Apply the SQL in `migrations/` using Supabase CLI or the SQL editor.

- `0001_init.sql`: Core schema + RLS policies.

Notes:
- RLS allows owners to access their projects and admins/agencies to read.
- Write access is limited to owners/admins.
