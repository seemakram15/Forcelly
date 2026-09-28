import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🔔</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>Forcelly</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Reminders that demand proof
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Sign in to continue your streak
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              rightIcon={
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
          </View>

          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth />

          <View style={styles.row}>
            <Text style={[styles.small, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={[styles.small, { color: colors.primary, fontWeight: '700' }]}>
                  Sign Up
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  hero: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 56 },
  appName: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: 14, fontWeight: '400' },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 4,
  },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 14, marginBottom: 20 },
  form: { gap: 0, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  small: { fontSize: 14 },
});
