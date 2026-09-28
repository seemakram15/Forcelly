import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
  const { session } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (session) router.replace('/(tabs)/');
      else router.replace('/(auth)/login');
    }, 100);
    return () => clearTimeout(timer);
  }, [session]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
