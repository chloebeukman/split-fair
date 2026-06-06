import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGuest, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    const isAuthenticated = !!session || isGuest;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/home');
    }
  }, [session, loading, segments, isGuest, isLoading]);

  if (loading || isLoading) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </AppProvider>
  );
}