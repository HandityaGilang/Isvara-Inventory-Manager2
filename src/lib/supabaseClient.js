
import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase
// NOTE: In a real production app, these should be in a .env file
// but for this implementation we'll keep them here for easier setup by the user.

const SUPABASE_URL = 'https://xrhbsfpiwbhggeadohqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaGJzZnBpd2JoZ2dlYWRvaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDEzNjgsImV4cCI6MjA4NDM3NzM2OH0.BU4-S1IDhog_lJ-Sk9Ec1xYnfl7a85kFjabjHsf1DxQ';

const isConfigured =
  SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  /^https?:\/\//.test(SUPABASE_URL);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => {
  return isConfigured;
};
