import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // anon key can't do alter table. Wait, we need service_role key or we can just ask the user to run the SQL in Supabase dashboard!
