import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const hasPlaceholderUrl =
  !supabaseUrl || /your-project-(id|ref)|example\.supabase\.co/i.test(supabaseUrl);
const hasPlaceholderKey =
  !supabaseAnonKey ||
  /^your-/i.test(supabaseAnonKey.trim()) ||
  /^placeholder/i.test(supabaseAnonKey.trim()) ||
  /^<.+>$/.test(supabaseAnonKey.trim());

export const supabaseConfigError =
  hasPlaceholderUrl || hasPlaceholderKey
    ? "Konfigurasi Supabase belum lengkap atau masih berupa nilai contoh. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (atau VITE_SUPABASE_PUBLISHABLE_KEY) dengan nilai project Supabase yang sebenarnya."
    : null;

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

