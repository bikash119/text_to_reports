# GitHub Issue: Fix Supabase Client Environment Variable Access

## Title: Fix Supabase Client Environment Variable Access in Cloudflare Workers Environment

## Description:
The current implementation of the Supabase client in `app/lib/supabase.ts` attempts to read environment variables using `import.meta.env` or `process.env` in server environments. However, according to Cloudflare Workers documentation, "environment variables are not available through import.meta.env or process.env". This causes the server-side execution of this code to fail to properly initialize the Supabase client with the correct environment variables.

Additionally, the application is creating two separate Supabase clients: one in `workers/app.ts` for API routes and another in `app/lib/supabase.ts` for frontend code. While having separate clients for different contexts is valid, we need to ensure both are properly initialized with the correct environment variables.

## Expected Behavior:
- The Supabase client in `app/lib/supabase.ts` should properly detect the execution environment (browser vs server)
- In browser environments, it should continue to use `window.__ENV__` to access variables
- In Cloudflare Worker environments (server-side), it should access environment variables from the Cloudflare context
- The server-side client should use either the same client created in `workers/app.ts` or initialize correctly with Cloudflare environment variables
- Both implementations should follow best practices for environment variable access in Cloudflare Workers

## Sub-tasks:
1. Refactor `app/lib/supabase.ts` to properly handle Cloudflare Workers environment
2. Ensure proper environment detection (browser vs server within Cloudflare)
3. Implement correct environment variable access in server-side execution
4. Write tests for client initialization in different environments
5. Update related documentation and comments
6. Ensure all existing functionality continues to work with the fixed implementation

## Additional Notes:
- Current environment variable access method: `import.meta.env` and `process.env`
- Correct method for Cloudflare Workers: Variables passed through the request context
- This bug affects server-side rendering where the Supabase client would be initialized incorrectly
- The fix should maintain backward compatibility with existing code that uses the client