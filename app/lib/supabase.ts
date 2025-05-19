import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anonymous key from environment variables
// These will be configured in Cloudflare environment variables
let supabaseUrl = '';
let supabaseAnonKey = '';

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // In client-side code, access from window.__ENV__ (populated in root.tsx)
  supabaseUrl = (window as any).__ENV__?.SUPABASE_URL || '';
  supabaseAnonKey = (window as any).__ENV__?.SUPABASE_ANON_KEY || '';
} else {
  // In server environments, access directly from process or env
  supabaseUrl = process.env.SUPABASE_URL || '';
  supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
}

// Organization-related functions
export async function getUserOrganizations(userId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}

export async function createOrganization(name: string, userId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .insert([{ name, user_id: userId }])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function switchOrganization(organizationId: string) {
  // This function can be expanded to handle any logic needed when switching orgs
  // For now, it just returns the ID to be stored in state/localStorage
  return organizationId;
}