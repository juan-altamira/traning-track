import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
