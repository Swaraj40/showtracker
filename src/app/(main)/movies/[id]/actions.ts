'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMovieStatus(movieId: number, status: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  if (status === null) {
    await supabase.from('user_movies').delete().match({ user_id: user.id, movie_id: movieId })
  } else {
    await supabase.from('user_movies').upsert(
      { user_id: user.id, movie_id: movieId, status, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,movie_id' }
    )
  }

  revalidatePath(`/movies/${movieId}`)
}

export async function toggleFavoriteMovie(movieId: number, isFavorite: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('user_movies')
    .select('status')
    .eq('user_id', user.id)
    .eq('movie_id', movieId)
    .single()

  await supabase.from('user_movies').upsert(
    { 
      user_id: user.id, 
      movie_id: movieId, 
      is_favorite: isFavorite,
      status: existing?.status || 'watchlist',
      updated_at: new Date().toISOString() 
    },
    { onConflict: 'user_id,movie_id' }
  )

  revalidatePath(`/movies/${movieId}`)
}
