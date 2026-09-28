import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Alert,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions, requestCameraPermissionsAsync } from 'expo-camera';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';

export default function ProofScreen() {
  const { occurrenceId } = useLocalSearchParams<{ occurrenceId: string }>();
  const { colors, isDark } = useTheme();
  const { user, profile, setProfile } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [occurrence, setOccurrence] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('reminder_occurrences')
      .select('*, reminder:reminders(title, category)')
      .eq('id', occurrenceId)
      .single()
      .then(({ data }) => setOccurrence(data));
  }, [occurrenceId]);

  async function takePhoto() {
    const { status } = await requestCameraPermissionsAsync();

    if (status !== 'granted') {
      pickFromGallery();
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function submitProof() {
    if (!imageUri || !user) return;
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const ext = imageUri.split('.').pop() ?? 'jpg';
      const path = `proofs/${user.id}/${occurrenceId}.${ext}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
      const proofUrl = urlData.publicUrl;

      // Update occurrence
      await supabase
        .from('reminder_occurrences')
        .update({ status: 'completed', proof_url: proofUrl, completed_at: new Date().toISOString() })
        .eq('id', occurrenceId);

      // Update profile score
      const newCompleted = (profile?.total_completed ?? 0) + 1;
      const total = newCompleted + (profile?.total_missed ?? 0);
      const score = Math.round((newCompleted / total) * 100);

      await supabase
        .from('profiles')
        .update({ total_completed: newCompleted, score })
        .eq('id', user.id);

      if (profile) setProfile({ ...profile, total_completed: newCompleted, score });

      setUploading(false);
      Alert.alert('✅ Proof submitted!', 'Great job! Reminder snoozed until next time.', [
        { text: 'Done', onPress: () => router.replace('/(tabs)/') },
      ]);
    } catch (err: any) {
      setUploading(false);
      Alert.alert('Upload failed', err?.message ?? 'Please try again.');
    }
  }

  const reminderTitle = occurrence?.reminder?.title ?? 'Reminder';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={[styles.title, { color: colors.text }]}>Proof Required</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Submit photo proof for{'\n'}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{reminderTitle}</Text>
        </Text>
        <Text style={[styles.note, { color: colors.accent }]}>
          You cannot dismiss this without proof
        </Text>
      </Animated.View>

      {/* Photo area */}
      <Animated.View entering={SlideInUp.delay(150).springify()} style={styles.photoArea}>
        {imageUri ? (
          <Pressable onPress={takePhoto} style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <View style={[styles.retakeOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
              <Text style={styles.retakeText}>Tap to retake</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.placeholder, { backgroundColor: colors.surfaceAlt, borderColor: colors.primary }]}
            onPress={takePhoto}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={[styles.placeholderText, { color: colors.primary }]}>
              Take a Photo
            </Text>
            <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
              Show proof that you completed this
            </Text>
          </Pressable>
        )}

        <Pressable onPress={pickFromGallery} style={styles.galleryBtn}>
          <Text style={[styles.galleryText, { color: colors.textSecondary }]}>
            📂 Choose from gallery
          </Text>
        </Pressable>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={SlideInUp.delay(250).springify()} style={styles.actions}>
        <Button
          label={uploading ? 'Submitting...' : 'Submit Proof ✓'}
          onPress={submitProof}
          loading={uploading}
          disabled={!imageUri}
          fullWidth
        />
        <Pressable
          style={styles.cancelNote}
          onPress={() =>
            Alert.alert(
              'Cannot dismiss without proof',
              'Forcelly requires proof to complete reminders. You can only delete a reminder from the main screen.',
              [{ text: 'OK' }]
            )
          }
        >
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>
            Why can't I just dismiss this?
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { paddingTop: 60, alignItems: 'center', gap: 8 },
  lock: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  note: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  photoArea: { flex: 1, justifyContent: 'center', gap: 12 },
  placeholder: {
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraIcon: { fontSize: 40 },
  placeholderText: { fontSize: 16, fontWeight: '700' },
  placeholderSub: { fontSize: 13 },
  imageWrapper: { position: 'relative', borderRadius: 20, overflow: 'hidden' },
  preview: { width: '100%', height: 220, borderRadius: 20 },
  retakeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
  },
  retakeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  galleryBtn: { alignItems: 'center', paddingVertical: 8 },
  galleryText: { fontSize: 14, fontWeight: '500' },
  actions: { gap: 8, paddingBottom: 16 },
  cancelNote: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 13 },
});
