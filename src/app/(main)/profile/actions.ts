'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const display_name = formData.get('display_name') as string
  const bio = formData.get('bio') as string
  const avatar_url = formData.get('avatar_url') as string

  const { error } = await supabase
    .from('profiles')
    .update({ 
      display_name: display_name || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/profile')
  revalidatePath('/')
}
