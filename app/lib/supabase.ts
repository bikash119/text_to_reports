import { createClient } from '@supabase/supabase-js';

/**
 * Cloudflare Workers Context - This global is populated by the Cloudflare Workers runtime
 * when supabase.ts is imported from a Workers environment
 */
declare global {
  // Add our context object that gets passed from app.ts
  var __CLOUDFLARE_CONTEXT__: {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    }
  } | undefined;
}

// Get Supabase URL and anonymous key from the appropriate environment
let supabaseUrl = '';
let supabaseAnonKey = '';

// Determine the execution environment and get the appropriate variables
if (typeof window !== 'undefined') {
  // BROWSER: Using window.__ENV__ which is populated in root.tsx
  supabaseUrl = (window as any).__ENV__?.SUPABASE_URL || '';
  supabaseAnonKey = (window as any).__ENV__?.SUPABASE_ANON_KEY || '';
} else if (global.__CLOUDFLARE_CONTEXT__) {
  // CLOUDFLARE WORKERS: Using the Cloudflare Workers context
  supabaseUrl = global.__CLOUDFLARE_CONTEXT__.env.SUPABASE_URL;
  supabaseAnonKey = global.__CLOUDFLARE_CONTEXT__.env.SUPABASE_ANON_KEY;
} else {
  // Fallback for other environments - this could be Node.js, Deno, etc.
  try {
    // Use import.meta.env for Vite-like environments
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const importMeta = import.meta as any;
      if (importMeta.env && importMeta.env.SUPABASE_URL && importMeta.env.SUPABASE_ANON_KEY) {
        supabaseUrl = importMeta.env.SUPABASE_URL;
        supabaseAnonKey = importMeta.env.SUPABASE_ANON_KEY;
      }
    }
  } catch (e) {
    // Ignore any errors accessing import.meta
  }
  
  // Final fallback to process.env for Node.js-like environments
  if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.SUPABASE_URL || '';
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  }
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