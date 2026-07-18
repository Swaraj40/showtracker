import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        display_name,
        avatar_url,
        username
      )
    `)
    .eq('media_type', 'show')
    .eq('media_id', 125988)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Count:', data?.length)
  }
}

test()
