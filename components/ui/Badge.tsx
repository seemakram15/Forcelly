import { View, Text, StyleSheet } from 'react-native';
import { ReminderCategory } from '../../types';
import { useTheme } from '../../hooks/useTheme';

const CATEGORY_COLORS: Record<ReminderCategory, { bg: string; text: string }> = {
  prayer: { bg: '#1E3A5F', text: '#60A5FA' },
  health: { bg: '#14532D', text: '#4ADE80' },
  fitness: { bg: '#431407', text: '#FB923C' },
  study: { bg: '#312E81', text: '#A78BFA' },
  work: { bg: '#1C1917', text: '#A8A29E' },
  habit: { bg: '#4C1D95', text: '#C4B5FD' },
  custom: { bg: '#1F2937', text: '#9CA3AF' },
};

const CATEGORY_ICONS: Record<ReminderCategory, string> = {
  prayer: '🕌',
  health: '💊',
  fitness: '🏋️',
  study: '📚',
  work: '💼',
  habit: '✨',
  custom: '🔔',
};

interface Props {
  category: ReminderCategory;
}

export function CategoryBadge({ category }: Props) {
  const style = CATEGORY_COLORS[category];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={styles.icon}>{CATEGORY_ICONS[category]}</Text>
      <Text style={[styles.label, { color: style.text }]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </View>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const { colors } = useTheme();
  const color = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error;
  return (
    <View style={[styles.scoreBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.scoreText, { color }]}>{score}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 12 },
  label: { fontSize: 11, fontWeight: '600' },
  scoreBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  scoreText: { fontSize: 13, fontWeight: '700' },
});
