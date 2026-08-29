import { cookies } from 'next/headers';
import { createServerClient, type SetAllCookies } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: ((cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component render; middleware refreshes the session instead
          }
        }) as SetAllCookies,
      },
      // Ohne das kann Next.js' fetch-Cache eine Antwort von User A für eine
      // identische Anfrage-URL an User B ausliefern, wenn eine Query nicht explizit
      // nach user_id filtert (RLS filtert zwar serverseitig richtig, aber der Cache-Key
      // basiert nur auf URL+Body, nicht auf dem Auth-Header). Jede Anfrage muss frisch sein.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  );
}
