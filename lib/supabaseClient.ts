import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
Client for frontend / browser usage (singleton)
*/
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  _client = createClient(url, key);
  return _client;
}

/*
Service client for backend (API routes, cron jobs) (singleton)
*/
let _serviceClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role key missing.");
  }

  _serviceClient = createClient(url, key);
  return _serviceClient;
}