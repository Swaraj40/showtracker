'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const media_type = formData.get('media_type') as string
  const media_id = formData.get('media_id') as string
  const rating = formData.get('rating') ? parseInt(formData.get('rating') as string, 10) : null
  const content = formData.get('content') as string
  const photo_url = formData.get('photo_url') as string

  if (!media_type || !media_id || !content) {
    throw new Error('Missing required fields')
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      media_type,
      media_id,
      rating,
      content,
      photo_url: photo_url || null
    })

  if (error) {
    console.error('Error inserting comment:', error)
    throw new Error('Failed to post comment')
  }

  revalidatePath(`/${media_type === 'movie' ? 'movies' : 'show'}/${media_id}/comments`)
  revalidatePath(`/${media_type === 'movie' ? 'movies' : 'show'}/${media_id}`)
}
