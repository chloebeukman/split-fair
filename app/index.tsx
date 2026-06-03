import { Redirect } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function Index() {
  const { hasOnboarded, isLoading } = useApp();
  if (isLoading) return null;
  return <Redirect href={hasOnboarded ? '/home' : '/onboarding'} />;
}