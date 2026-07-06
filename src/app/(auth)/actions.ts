'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login Error:', error)
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup Error:', error)
    redirect('/signup?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordForEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  // Get the base URL from the request headers
  const { headers } = await import('next/headers')
  const host = (await headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    redirect('/forgot-password?message=Could not send reset password email.')
  }

  redirect('/forgot-password?message=Check your email for the password reset link.')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    console.error('Update password error:', error)
    redirect('/reset-password?message=There was an error updating your password.')
  }

  redirect('/login?message=Password updated successfully! Please log in.')
}
