const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://abcdefghijklmnopqr.supabase.co', 'fake-key')
supabase.auth.getUser().then(console.log).catch(console.error)
