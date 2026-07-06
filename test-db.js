import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data: d1, error: e1 } = await supabase.from('item_ratings').select('*').limit(1)
  const { data: d2, error: e2 } = await supabase.from('item_emotions').select('*').limit(1)
  console.log("Ratings Error:", e1?.message || "No error")
  console.log("Emotions Error:", e2?.message || "No error")
}
test()
