import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { hasRole, normalizeRole } from "./roles";
import { supabase, supabaseConfigError } from "./supabase";

export type AuthProfile = {
  user: User;
  roles: string[];
  profileName: string;
};

type AuthContextValue = {
  auth: AuthProfile | null;
  hasSession: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type UserRoleRecord = {
  roles:
    | { nama_role?: string | null }
    | { nama_role?: string | null }[]
    | null;
};

function getProfileName(user: User): string {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email ?? "Pengguna";
}

async function loadAuth(session: Session): Promise<AuthProfile> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles!user_roles_role_id_fkey(nama_role)")
    .eq("user_id", session.user.id);

  if (error) {
    throw new Error(
      "Peran akun tidak dapat dimuat. Pastikan tabel user_roles dan izin baca peran pengguna sudah dikonfigurasi."
    );
  }

  const roles = ((data ?? []) as UserRoleRecord[])
    .map((row) => (Array.isArray(row.roles) ? row.roles[0] : row.roles)?.nama_role)
    .filter((role): role is string => typeof role === "string" && Boolean(role.trim()))
    .map(normalizeRole);

  return {
    user: session.user,
    roles,
    profileName: getProfileName(session.user),
  };
}

function getSignInError(message: string): string {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("email not confirmed")) {
    return "Email akun belum dikonfirmasi. Hubungi Admin Pondok.";
  }
  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Email atau password tidak sesuai.";
  }
  if (
    normalizedMessage.includes("invalid api key") ||
    normalizedMessage.includes("api key not valid")
  ) {
    return "API key Supabase tidak valid. Periksa VITE_SUPABASE_ANON_KEY di file .env.";
  }
  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network request failed")
  ) {
    return "Tidak dapat terhubung ke Supabase. Periksa VITE_SUPABASE_URL dan koneksi internet.";
  }
  return "Tidak dapat masuk. Periksa koneksi dan konfigurasi akun Anda.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [auth, setAuth] = useState<AuthProfile | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(supabaseConfigError);

  useEffect(() => {
    if (supabaseConfigError) {
      setInitialized(true);
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuth(null);
      setError(null);
      setInitialized(true);
      setLoading(Boolean(nextSession));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!session) {
      setAuth(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    loadAuth(session)
      .then((profile) => {
        if (!active) return;
        setAuth(profile);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Gagal memuat peran pengguna:", loadError);
        setAuth(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Peran akun tidak dapat dimuat."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialized, session]);

  const signIn = async (email: string, password: string) => {
    if (supabaseConfigError) return { error: supabaseConfigError };

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) return { error: getSignInError(signInError.message) };
    return {};
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };

  const value = useMemo(
    () => ({ auth, hasSession: Boolean(session), loading, error, signIn, signOut }),
    [auth, session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { hasRole };
