import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://svauqikrefvfnfradzij.supabase.co'
const supabaseKey = 'sb_publishable_vRMfAxBsej2avtmeahbVIA_ruFbMw3a'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('profiles').select('username').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data)
  }
}
test()
