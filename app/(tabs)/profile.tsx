import { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ScrollView, StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { ScoreBadge } from '../../components/ui/Badge';

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { profile, user, setProfile, clear } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clear();
        },
      },
    ]);
  }

  const total = (profile?.total_completed ?? 0) + (profile?.total_missed ?? 0);
  const pct = total === 0 ? 100 : Math.round(((profile?.total_completed ?? 0) / total) * 100);
  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <Animated.View entering={FadeIn} style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.full_name ?? 'User'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          <ScoreBadge score={pct} />
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Card elevated style={styles.statsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats</Text>
            <View style={styles.statsRow}>
              <StatBox label="Completed" value={profile?.total_completed ?? 0} color={colors.success} />
              <StatBox label="Missed" value={profile?.total_missed ?? 0} color={colors.error} />
              <StatBox label="Score" value={`${pct}%`} color={colors.primary} />
            </View>

            {/* Score bar */}
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error }]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
              Completion rate across all reminders
            </Text>
          </Card>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInUp.delay(160).springify()}>
          <Card style={styles.infoCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Forcelly</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Forcelly keeps you accountable by requiring{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>photo proof</Text>{' '}
              to dismiss each reminder. You can delete reminders but cannot snooze without proof.
            </Text>
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(220).springify()}>
          <Pressable
            style={[styles.logoutBtn, { borderColor: colors.error, borderWidth: 1 }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100, gap: 16 },
  avatarSection: { alignItems: 'center', gap: 6, paddingBottom: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 13, marginBottom: 4 },
  statsCard: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  barBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11 },
  infoCard: {},
  infoText: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  logoutBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 15, fontWeight: '600' },
});
