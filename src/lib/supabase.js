// Optional Supabase adapter for scalable Postgres backend.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to enable.
// If not set, the app will fall back to local IndexedDB/localStorage.

import { createClient } from '@supabase/supabase-js'

let supabase = null
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (e) {
  // ignore; fallback to local storage
}

export { supabase }

// Helper to get current user ID from AuthContext or guest
export async function currentUserId() {
  // In real usage, this would be called from within a component that has AuthContext
  // For now, we expose a simple fallback that reads from localStorage
  const { loadJSON } = await import('./storage.js')
  const auth = await loadJSON('wrenAuthCurrent', null)
  return auth || (await loadJSON('wrenGuestId')) || null
}

// Example functions for future use:
// - upsertUserProfile
// - fetchUserDocuments
// - upsertDocument
// - fetchLessonsByUser
// - upsertLesson
// - upsertUserProgress

// Uncomment and adapt as needed:
/*
export async function upsertUserProfile(profile) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchUserDocuments(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', userId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data || []
}
*/
