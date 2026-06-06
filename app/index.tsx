import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { hasOnboarded, isLoading, groups } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const check = async () => {
      const [{ data: { session } }, guestMode] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem('splitfair_guest_mode'),
      ]);
      const isAuthenticated = !!session || guestMode === 'true';

      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (!hasOnboarded || groups.length === 0) {
        router.replace('/onboarding');
      } else {
        router.replace('/home');
      }
    };

    check();
  }, [isLoading]);

  return null;
}