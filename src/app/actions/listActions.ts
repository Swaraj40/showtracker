'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserLists() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: lists } = await supabase
    .from('user_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return lists || []
}

export async function createList(name: string, coverPath?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_lists')
    .insert({
      user_id: user.id,
      name,
      cover_path: coverPath || null
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/profile')
  return data
}

export async function addToList(listId: string, itemId: number, mediaType: 'tv' | 'movie') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // We rely on RLS to ensure the user owns the list
  const { error } = await supabase
    .from('user_list_items')
    .insert({
      list_id: listId,
      item_id: itemId,
      media_type: mediaType
    })

  if (error && error.code !== '23505') { // Ignore unique constraint violation (already in list)
    throw error
  }

  revalidatePath('/profile')
}
