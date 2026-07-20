'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkUsername(username: string): Promise<{ available: boolean, suggestions?: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { available: false }
  
  // Basic validation: 4 to 12 chars, no spaces
  if (!username || username.length < 4 || username.length > 12 || /\s/.test(username)) {
    return { available: false }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id) // exclude current user
    .maybeSingle()

  if (error) {
    console.error('Error checking username:', error)
    return { available: false } // Fail safe
  }

  // If data exists, the username is taken
  if (data) {
    // Generate some suggestions
    const suggestions = [
      `${username}${Math.floor(Math.random() * 100)}`,
      `${username}_${Math.floor(Math.random() * 10)}`,
      `${username}${new Date().getFullYear().toString().slice(-2)}`
    ].filter(s => s.length <= 12) // Keep under max length
    
    return { available: false, suggestions }
  }

  return { available: true }
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

  // Get current profile to check if username actually changed
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Only check username availability if it actually changed
  if (username && username !== currentProfile?.username) {
    const result = await checkUsername(username)
    if (!result.available) {
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

  // Note: We intentionally do NOT call revalidatePath here.
  // revalidatePath('/profile') triggers a server re-render of the profile page
  // inside the same action response. The profile page does heavy TMDB API calls
  // which can fail/timeout, causing the entire action to crash with:
  // "An error occurred in the Server Components render"
  // Instead, the client handles refresh via window.location.reload().
}
