import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useRemindersStore } from '../../store/reminders';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ReminderCategory, ReminderTime } from '../../types';
import { scheduleReminderNotifications, requestNotificationPermission, setupAndroidChannel, formatTime } from '../../lib/notifications';

const CATEGORIES: { value: ReminderCategory; label: string; emoji: string }[] = [
  { value: 'prayer', label: 'Prayer', emoji: '🕌' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { value: 'study', label: 'Study', emoji: '📚' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'habit', label: 'Habit', emoji: '✨' },
  { value: 'custom', label: 'Custom', emoji: '🔔' },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Simple time picker options (on-device, no native picker)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export default function CreateReminderScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const addReminder = useRemindersStore((s) => s.addReminder);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [times, setTimes] = useState<ReminderTime[]>([{ hour: 7, minute: 0, label: '' }]);
  const [loading, setLoading] = useState(false);

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  function addTime() {
    setTimes((prev) => [...prev, { hour: 12, minute: 0, label: '' }]);
  }

  function removeTime(i: number) {
    setTimes((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTime(i: number, field: keyof ReminderTime, value: number | string) {
    setTimes((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t))
    );
  }

  async function handleCreate() {
    if (!title.trim()) { Alert.alert('Title required', 'Give your reminder a name.'); return; }
    if (days.length === 0) { Alert.alert('Select days', 'Pick at least one day.'); return; }
    if (times.length === 0) { Alert.alert('Add time', 'Add at least one time.'); return; }

    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Notifications blocked', 'Please enable notifications in Settings to use reminders.');
      return;
    }
    await setupAndroidChannel();

    setLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        times,
        days_of_week: days,
        is_active: true,
        proof_required: true,
      })
      .select()
      .single();

    if (error || !data) {
      setLoading(false);
      Alert.alert('Error', error?.message ?? 'Failed to save');
      return;
    }

    addReminder(data);
    await scheduleReminderNotifications(data);
    setLoading(false);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>New Reminder</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Proof required to dismiss 📸
          </Text>
        </View>

        {/* Basic info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input label="Title" placeholder="e.g. Fajr Prayer" value={title} onChangeText={setTitle} />
          <Input
            label="Description (optional)"
            placeholder="What does this remind you of?"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ minHeight: 60, textAlignVertical: 'top', paddingTop: 8 }}
          />
        </View>

        {/* Category */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === c.value ? colors.primary : colors.surfaceAlt,
                    borderColor: category === c.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(c.value)}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, { color: category === c.value ? '#fff' : colors.text }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Days */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Repeat on</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((d, i) => (
              <Pressable
                key={i}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: days.includes(i) ? colors.primary : colors.surfaceAlt,
                    borderColor: days.includes(i) ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayBtnText, { color: days.includes(i) ? '#fff' : colors.textSecondary }]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Times */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.timesHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Times</Text>
            <Pressable onPress={addTime} style={[styles.addTimeBtn, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.addTimeText, { color: colors.primary }]}>+ Add Time</Text>
            </Pressable>
          </View>

          {times.map((t, i) => (
            <View key={i} style={[styles.timeRow, { borderColor: colors.border }]}>
              <View style={styles.timeSelectors}>
                {/* Hour */}
                <View style={[styles.timeBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Pressable onPress={() => updateTime(i, 'hour', (t.hour - 1 + 24) % 24)}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▲</Text>
                  </Pressable>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {String(t.hour % 12 || 12).padStart(2, '0')}
                  </Text>
                  <Pressable onPress={() => updateTime(i, 'hour', (t.hour + 1) % 24)}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▼</Text>
                  </Pressable>
                </View>

                <Text style={[styles.colon, { color: colors.text }]}>:</Text>

                {/* Minute */}
                <View style={[styles.timeBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Pressable onPress={() => updateTime(i, 'minute', (t.minute - 5 + 60) % 60)}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▲</Text>
                  </Pressable>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {String(t.minute).padStart(2, '0')}
                  </Text>
                  <Pressable onPress={() => updateTime(i, 'minute', (t.minute + 5) % 60)}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▼</Text>
                  </Pressable>
                </View>

                {/* AM/PM */}
                <Pressable
                  style={[styles.ampmBtn, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => updateTime(i, 'hour', t.hour < 12 ? t.hour + 12 : t.hour - 12)}
                >
                  <Text style={[styles.ampmText, { color: colors.primary }]}>
                    {t.hour < 12 ? 'AM' : 'PM'}
                  </Text>
                </Pressable>
              </View>

              <Input
                placeholder="Label (e.g. Fajr)"
                value={t.label ?? ''}
                onChangeText={(v) => updateTime(i, 'label', v)}
                style={{ flex: 1 }}
              />

              {times.length > 1 && (
                <Pressable onPress={() => removeTime(i)} style={styles.removeTime}>
                  <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <Button label="Create Reminder" onPress={handleCreate} loading={loading} fullWidth style={{ marginTop: 8 }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16 },
  header: { paddingTop: 40, gap: 4, marginBottom: 8 },
  backBtn: { marginBottom: 8 },
  back: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 13 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  dayBtnText: { fontSize: 11, fontWeight: '700' },
  timesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addTimeBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addTimeText: { fontSize: 13, fontWeight: '600' },
  timeRow: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  timeSelectors: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBox: { alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 52 },
  timeArrow: { fontSize: 14, fontWeight: '700', paddingVertical: 2 },
  timeValue: { fontSize: 22, fontWeight: '700' },
  colon: { fontSize: 22, fontWeight: '700' },
  ampmBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 },
  ampmText: { fontSize: 14, fontWeight: '700' },
  removeTime: { alignSelf: 'center', padding: 4 },
});
