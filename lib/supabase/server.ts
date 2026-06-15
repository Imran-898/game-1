// ============================================================
// ZipRace – Supabase Server Client
// Server-only. Uses service_role for trusted server operations.
// ============================================================
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )!;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component – cookies can't be set, ignore
          }
        },
      },
    }
  );
}

/** Admin client with service_role key – NEVER expose to client */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (serviceRoleKey ?? fallbackKey)!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
