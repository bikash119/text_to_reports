import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ 
          data: [], 
          error: null 
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: [{ id: 'test-id', name: 'Test Org', user_id: 'test-user' }],
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('Supabase Client', () => {
  // Save original environment
  const originalWindow = global.window;
  const originalProcess = global.process;

  // Mock window object for browser environment tests
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.process = originalProcess;
    
    // Clear Cloudflare context
    vi.stubGlobal('__CLOUDFLARE_CONTEXT__', undefined);
    
    // Reset module cache to force re-import
    vi.resetModules();
  });

  // Test browser environment
  it('should initialize client with window.__ENV__ variables in browser environment', async () => {
    // Mock window
    global.window = {
      ...global.window,
      __ENV__: {
        SUPABASE_URL: 'https://browser-test.supabase.co',
        SUPABASE_ANON_KEY: 'browser-test-key'
      }
    };

    // Import the module (after setting up the environment)
    const { supabase } = await import('../../lib/supabase');

    // Verify createClient was called with correct parameters
    expect(createClient).toHaveBeenCalledWith(
      'https://browser-test.supabase.co',
      'browser-test-key'
    );
  });

  // Test server environment with Cloudflare context
  it('should initialize client with Cloudflare context in Cloudflare Workers environment', async () => {
    // Mock window as undefined to simulate server environment
    global.window = undefined as any;
    
    // Mock __CLOUDFLARE_CONTEXT__ global
    vi.stubGlobal('__CLOUDFLARE_CONTEXT__', {
      env: {
        SUPABASE_URL: 'https://cloudflare-test.supabase.co',
        SUPABASE_ANON_KEY: 'cloudflare-test-key'
      }
    });

    // Import the module (after setting up the environment)
    const { supabase } = await import('../../lib/supabase');

    // Verify it uses the Cloudflare context environment variables
    expect(createClient).toHaveBeenCalledWith(
      'https://cloudflare-test.supabase.co', 
      'cloudflare-test-key'
    );
  });

  // Test server environment with process.env fallback
  it('should fallback to process.env when Cloudflare context is not available', async () => {
    // Clear Cloudflare context
    vi.stubGlobal('__CLOUDFLARE_CONTEXT__', undefined);
    
    // Mock window as undefined to simulate server environment
    global.window = undefined as any;
    
    // Mock process.env
    global.process = {
      ...global.process,
      env: {
        SUPABASE_URL: 'https://process-env-test.supabase.co',
        SUPABASE_ANON_KEY: 'process-env-test-key'
      }
    };

    // Import the module (after setting up the environment)
    const { supabase } = await import('../../lib/supabase');

    // Verify the client falls back to process.env
    expect(createClient).toHaveBeenCalledWith(
      'https://process-env-test.supabase.co', 
      'process-env-test-key'
    );
  });

  // Test fallback to empty values when no environment is available
  it('should fallback to empty values when no environment variables are available', async () => {
    // Clear all environment sources
    global.window = undefined as any;
    vi.stubGlobal('__CLOUDFLARE_CONTEXT__', undefined);
    vi.stubGlobal('import', { meta: { env: {} } });
    global.process = { env: {} };

    // Import the module (after setting up the environment)
    const { supabase } = await import('../../lib/supabase');

    // Verify the client is initialized with empty strings as last resort
    expect(createClient).toHaveBeenCalledWith('', '');
  });

  // Test the helper functions
  it('should export helper functions for Supabase operations', async () => {
    // Import the module
    const { getUserOrganizations, createOrganization, switchOrganization } = await import('../../lib/supabase');

    // Check that helper functions exist
    expect(getUserOrganizations).toBeDefined();
    expect(createOrganization).toBeDefined();
    expect(switchOrganization).toBeDefined();
  });

  // Test error handling
  it('should handle Supabase errors correctly', async () => {
    // Import the module
    const { handleSupabaseError } = await import('../../lib/supabase');

    // Check error handling
    const error = { message: 'Test error' };
    expect(handleSupabaseError(error)).toBe('Test error');

    // Check fallback message
    expect(handleSupabaseError(null)).toBe('An unexpected error occurred');
  });
});