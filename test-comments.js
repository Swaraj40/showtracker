import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=')
  if (key && value) acc[key.trim()] = value.trim()
  return acc
}, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data: d1, error: e1 } = await supabase.from('item_interests').select('*').limit(1)
  console.log("item_interests Error:", e1)
  const { data: d2, error: e2 } = await supabase.from('item_ratings').select('*').limit(1)
  console.log("item_ratings Error:", e2)
}
test()
