import { createRequestHandler } from "react-router";
import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from '@supabase/supabase-js';

// Import API routes
import organizationsRouter from "./routes/organizations";

declare module "hono" {
  interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    VALUE_FROM_CLOUDFLARE: string;
    supabase: ReturnType<typeof createClient>;
  }
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

// Create the React Router request handler
const reactRouterHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

// Create middleware for Supabase
const supabaseMiddleware = async (c: any, next: any) => {
  const { env } = c;
  
  // Create Supabase client with the service key (for admin operations)
  c.env.supabase = createClient(
    env.SUPABASE_URL, 
    env.SUPABASE_ANON_KEY
  );
  
  await next();
};

// Create the Hono app for API routes
const api = new Hono()
  .use("*", poweredBy())
  .use("*", logger())
  .use("*", cors())
  .use("*", supabaseMiddleware)
  .route("/organizations", organizationsRouter);

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// Mount the API routes at /api
app.route("/api", api);

// Forward all other requests to React Router
app.all("*", async (c) => {
  const { req, env, executionCtx } = c;
  
  // Set up the Cloudflare context for the Supabase client in app/lib/supabase.ts
  // This makes the environment variables available to the client-side code
  global.__CLOUDFLARE_CONTEXT__ = { env };
  
  return reactRouterHandler(req, {
    cloudflare: { env, ctx: executionCtx },
  });
});

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;