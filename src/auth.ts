import { createClient, type Session, type User } from '@supabase/supabase-js';
import { useEffect, useState, useSyncExternalStore } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isCloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

let currentSession: Session | null = null;
let currentWorkspaceId: string | null = localStorage.getItem('unidash.workspace_id');
const authListeners = new Set<() => void>();

function notify() {
  authListeners.forEach((l) => l());
}

export function subscribeAuth(listener: () => void) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

// Initial session check
supabase.auth.getSession().then(({ data }) => {
  currentSession = data.session;
  notify();
});

// Real-time auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
  notify();
});

export function getAuthToken(): string | null {
  return currentSession?.access_token ?? null;
}

export function getCurrentWorkspaceId(): string | null {
  return currentWorkspaceId;
}

export function setCurrentWorkspaceId(id: string | null) {
  currentWorkspaceId = id;
  if (id) localStorage.setItem('unidash.workspace_id', id);
  else localStorage.removeItem('unidash.workspace_id');
  notify();
}

export function useAuth() {
  const session = useSyncExternalStore(subscribeAuth, () => currentSession);
  const user = session?.user ?? null;
  const workspaceId = useSyncExternalStore(subscribeAuth, () => currentWorkspaceId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If signed in and no workspace is selected, get workspace info from API
    if (user && !workspaceId) {
      import('./api').then(({ api }) => {
        api.getWorkspace()
          .then((ws) => {
            if (ws?.workspaceId) setCurrentWorkspaceId(ws.workspaceId);
          })
          .catch(() => undefined);
      });
    }
  }, [user, workspaceId]);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentSession = data.session;
      notify();
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) throw error;
      currentSession = data.session;
      notify();
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithOtp = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      currentSession = null;
      setCurrentWorkspaceId(null);
      notify();
    } finally {
      setLoading(false);
    }
  };

  return {
    isCloudEnabled,
    user,
    session,
    workspaceId,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signOut,
    setWorkspaceId: setCurrentWorkspaceId,
  };
}
