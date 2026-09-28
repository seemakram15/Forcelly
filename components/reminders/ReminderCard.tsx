import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Reminder } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { CategoryBadge } from '../ui/Badge';
import { formatTime } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { useRemindersStore } from '../../store/reminders';
import { cancelReminderNotifications } from '../../lib/notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  reminder: Reminder;
  index: number;
}

export function ReminderCard({ reminder, index }: Props) {
  const { colors } = useTheme();
  const removeReminder = useRemindersStore((s) => s.removeReminder);

  async function handleDelete() {
    Alert.alert('Delete Reminder', `Delete "${reminder.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelReminderNotifications(reminder.id);
          await supabase.from('reminders').delete().eq('id', reminder.id);
          removeReminder(reminder.id);
        },
      },
    ]);
  }

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).springify()}>
      <Card elevated style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{reminder.title}</Text>
            <View style={[styles.activeDot, { backgroundColor: reminder.is_active ? colors.success : colors.textMuted }]} />
          </View>
          <CategoryBadge category={reminder.category} />
        </View>

        {reminder.description ? (
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {reminder.description}
          </Text>
        ) : null}

        <View style={styles.times}>
          {reminder.times.map((t, i) => (
            <View key={i} style={[styles.timePill, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.timeText, { color: colors.primary }]}>
                {formatTime(t.hour, t.minute)}
                {t.label ? ` · ${t.label}` : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.days}>
          {DAYS.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dayDot,
                {
                  backgroundColor: reminder.days_of_week.includes(i)
                    ? colors.primary
                    : colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.dayText, { color: reminder.days_of_week.includes(i) ? '#fff' : colors.textMuted }]}>
                {d[0]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={[styles.proofBadge, { backgroundColor: colors.accent + '22' }]}>
            <Text style={{ fontSize: 10 }}>📸</Text>
            <Text style={[styles.proofText, { color: colors.accent }]}>Proof required</Text>
          </View>
          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={[styles.deleteText, { color: colors.error }]}>🗑 Delete</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  timePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  timeText: { fontSize: 12, fontWeight: '600' },
  days: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  dayDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 10, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proofBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  proofText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { fontSize: 13, fontWeight: '500' },
});
