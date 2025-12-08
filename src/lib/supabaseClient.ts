import { createBrowserClient } from '@supabase/auth-helpers-sveltekit';
import { env } from '$env/dynamic/public';

const SUPABASE_URL = env.PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY ?? 'anon-placeholder';

export const supabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
