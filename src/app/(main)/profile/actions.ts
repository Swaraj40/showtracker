'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false
  
  // Basic validation
  if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return false
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id) // exclude current user
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error checking username:', error)
    return false // Fail safe
  }

  // If data exists, the username is taken
  return !data
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const display_name = formData.get('display_name') as string
  const bio = formData.get('bio') as string
  const avatar_url = formData.get('avatar_url') as string
  const username = formData.get('username') as string

  // Final check on username before updating
  if (username) {
    const isAvailable = await checkUsername(username)
    if (!isAvailable) {
      throw new Error('Username is not available')
    }
  }

  const updateData: any = { 
    display_name: display_name || null,
    bio: bio || null,
    avatar_url: avatar_url || null,
    updated_at: new Date().toISOString()
  }

  if (username) {
    updateData.username = username
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error(error.code === '23505' ? 'Username is already taken' : 'Failed to update profile')
  }

  revalidatePath('/profile')
  revalidatePath('/')
}
