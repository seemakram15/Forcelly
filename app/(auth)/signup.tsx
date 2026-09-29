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

export default function SignupScreen() {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password || password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); Alert.alert('Signup failed', error.message); return; }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        score: 100,
        total_completed: 0,
        total_missed: 0,
      });
      if (profileError) console.warn('Profile insert failed:', profileError.message);
    }

    setLoading(false);

    // If email confirmation is disabled, session is set and onAuthStateChange handles redirect.
    // If confirmation is required, tell the user to check email.
    if (!data.session) {
      Alert.alert('Check your email', 'We sent a confirmation link. Confirm it, then sign in.');
      router.replace('/(auth)/login');
    }
    // else: onAuthStateChange in _layout fires → app/index.tsx redirects to (tabs)
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
        <View style={styles.hero}>
          <Text style={styles.logo}>✨</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>Join Forcelly</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Build habits that stick — with proof
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Start with a perfect score of 100%
          </Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Ali Hassan"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />
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
              placeholder="Min. 8 characters"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              rightIcon={<Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>}
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
            <Input
              label="Confirm Password"
              placeholder="Repeat password"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />
          </View>

          <Button label="Create Account" onPress={handleSignup} loading={loading} fullWidth />

          <View style={styles.row}>
            <Text style={[styles.small, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.small, { color: colors.primary, fontWeight: '700' }]}>
                  Sign In
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
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 24 },
  hero: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 56 },
  appName: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: 14 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, gap: 4 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 14, marginBottom: 20 },
  form: { gap: 0, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  small: { fontSize: 14 },
});
