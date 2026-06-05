import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { hasOnboarded, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login');
      } else if (!hasOnboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/home');
      }
    });
  }, [isLoading]);

  return null;
}