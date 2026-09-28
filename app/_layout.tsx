import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { setupAndroidChannel } from '../lib/notifications';

export default function RootLayout() {
  const { session, setSession, setProfile, clear } = useAuthStore();

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else clear();
    });

    // Android notification channel
    setupAndroidChannel();

    // Request permissions
    ImagePicker.requestMediaLibraryPermissionsAsync();

    return () => subscription.unsubscribe();
  }, []);

  // Navigate on notification tap
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.requiresProof && data?.reminderId) {
        // Create or fetch the pending occurrence then navigate
        handleNotificationTap(data.reminderId as string);
      }
    });
    return () => sub.remove();
  }, [session]);

  async function handleNotificationTap(reminderId: string) {
    if (!session?.user) return;
    // Upsert a pending occurrence for this tap
    const scheduledAt = new Date().toISOString();
    const { data } = await supabase
      .from('reminder_occurrences')
      .insert({
        reminder_id: reminderId,
        scheduled_at: scheduledAt,
        status: 'pending',
      })
      .select()
      .single();
    if (data) router.push(`/proof/${data.id}`);
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reminder/create"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="proof/[occurrenceId]"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
