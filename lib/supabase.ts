import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://ngkicciiqihchbrbnuzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2ljY2lpcWloY2hicmJudXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDQwNzgsImV4cCI6MjA5NjE4MDA3OH0.eJof_FEqLFgbq1jSEJC-CLjMzCppiYct0Qx-JS0MfLU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});