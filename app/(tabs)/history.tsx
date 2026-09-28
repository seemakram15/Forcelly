import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, RefreshControl, StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { ReminderOccurrence } from '../../types';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  completed: '#22C55E',
  snoozed: '#F59E0B',
  missed: '#EF4444',
  pending: '#6B7280',
};

const STATUS_ICONS: Record<string, string> = {
  completed: '✅',
  snoozed: '⏭️',
  missed: '❌',
  pending: '⏳',
};

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [occurrences, setOccurrences] = useState<ReminderOccurrence[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reminder_occurrences')
      .select('*, reminder:reminders(title, category)')
      .eq('reminders.user_id', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(50);
    if (data) setOccurrences(data as unknown as ReminderOccurrence[]);
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

      <Animated.View entering={FadeIn} style={[styles.header, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Your proof trail 📋</Text>
      </Animated.View>

      <FlatList
        data={occurrences}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 40).springify()}>
            <Card style={styles.item}>
              <View style={styles.row}>
                <Text style={styles.icon}>{STATUS_ICONS[item.status]}</Text>
                <View style={styles.info}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {(item.reminder as any)?.title ?? 'Reminder'}
                  </Text>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>
                    {format(new Date(item.scheduled_at), 'EEE, MMM d · h:mm a')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              {item.proof_url && (
                <Image
                  source={{ uri: item.proof_url }}
                  style={styles.proof}
                  resizeMode="cover"
                />
              )}
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Your completed reminders will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  item: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  proof: { width: '100%', height: 120, borderRadius: 10, marginTop: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
