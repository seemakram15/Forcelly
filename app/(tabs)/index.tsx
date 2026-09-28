import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useRemindersStore } from '../../store/reminders';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';
import { ReminderCard } from '../../components/reminders/ReminderCard';
import { Reminder } from '../../types';

export default function RemindersScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { reminders, setReminders } = useRemindersStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setReminders(data as Reminder[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Animated.View entering={FadeIn} style={[styles.header, { backgroundColor: colors.bg }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Stay accountable 🎯</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Reminders</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/reminder/create')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </Animated.View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ReminderCard reminder={item} index={index} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reminders yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add your first reminder and{'\n'}start proving yourself
            </Text>
            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push('/reminder/create')}
            >
              <Text style={[styles.createBtnText, { color: colors.primary }]}>
                Create First Reminder
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  createBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  createBtnText: { fontWeight: '700', fontSize: 15 },
});
