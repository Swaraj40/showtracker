import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const test1 = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.swaraj40,id.eq.swaraj40`)
    .single()
  console.log('Test with username "swaraj40":', test1.error)

  const test2 = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.123e4567-e89b-12d3-a456-426614174000,id.eq.123e4567-e89b-12d3-a456-426614174000`)
    .single()
  console.log('Test with UUID:', test2.error)
}

test()
