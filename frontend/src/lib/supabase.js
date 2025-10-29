/**
 * supabase.js
 *
 * Initialises and exports a single shared Supabase client instance used
 * throughout the application for authentication and database access.
 *
 * Credentials are read from Vite environment variables so they are never
 * hard-coded in source control.  Create a `.env` file at the project root:
 *
 *   VITE_SUPABASE_URL=https://<your-project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
 *
 * The anon key is safe to expose in the browser — Row Level Security (RLS)
 * policies on the Supabase side enforce per-user data access.
 */
import { createClient } from '@supabase/supabase-js'

// These values come from the .env file and are injected at build time by Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Export a single client so every module shares the same connection/session.
export const supabase = createClient(supabaseUrl, supabaseKey)
