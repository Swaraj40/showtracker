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

export async function getUserListsWithItemStatus(itemId: number, mediaType: 'tv' | 'movie') {
  const lists = await getUserLists()
  if (lists.length === 0) return []

  const supabase = await createClient()
  
  // Find which lists contain this item
  const { data: items } = await supabase
    .from('user_list_items')
    .select('list_id')
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .in('list_id', lists.map(l => l.id))

  const listsWithItem = new Set((items || []).map(i => i.list_id))

  return lists.map(list => ({
    ...list,
    hasItem: listsWithItem.has(list.id)
  }))
}


import { getShowDetails, getMovieDetails } from '@/lib/tmdb'

export async function getUserListsWithPosters() {
  const lists = await getUserLists()
  const supabase = await createClient()

  // For each list, get up to 4 items to create the poster collage
  const listsWithPosters = await Promise.all(
    lists.map(async (list) => {
      const { data: listItems } = await supabase
        .from('user_list_items')
        .select('*')
        .eq('list_id', list.id)
        .order('created_at', { ascending: false })
        .limit(4)

      if (!listItems || listItems.length === 0) {
        return { ...list, posters: [] }
      }

      // Fetch TMDB data for each item
      const posters = await Promise.all(
        listItems.map(async (item) => {
          try {
            if (item.media_type === 'tv') {
              const show = await getShowDetails(item.item_id)
              return show?.poster_path
            } else if (item.media_type === 'movie') {
              const movie = await getMovieDetails(item.item_id)
              return movie?.poster_path
            }
          } catch (e) {
            console.error(`Failed to fetch TMDB data for ${item.media_type} ${item.item_id}`, e)
            return null
          }
          return null
        })
      )

      return {
        ...list,
        posters: posters.filter(Boolean) as string[],
      }
    })
  )

  return listsWithPosters
}

export async function getListDetailsWithItems(listId: string) {
  const supabase = await createClient()
  
  // Get list info
  const { data: listData, error: listError } = await supabase
    .from('user_lists')
    .select('*')
    .eq('id', listId)
    .single()

  if (listError || !listData) throw new Error('List not found')

  // Get items
  const { data: listItems } = await supabase
    .from('user_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false })

  const items = await Promise.all(
    (listItems || []).map(async (item) => {
      try {
        if (item.media_type === 'tv') {
          const show = await getShowDetails(item.item_id)
          return {
            id: item.item_id,
            media_type: 'tv',
            name: show?.name || '',
            poster_path: show?.poster_path || null
          }
        } else if (item.media_type === 'movie') {
          const movie = await getMovieDetails(item.item_id)
          return {
            id: item.item_id,
            media_type: 'movie',
            name: movie?.title || '',
            poster_path: movie?.poster_path || null
          }
        }
      } catch (e) {
        console.error(`Failed to fetch TMDB data for ${item.media_type} ${item.item_id}`, e)
        return null
      }
      return null
    })
  )

  return {
    ...listData,
    items: items.filter(Boolean)
  }
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
