import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder, ReminderTime } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('forcelly-reminders', {
    name: 'Forcelly Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

export async function scheduleReminderNotifications(reminder: Reminder) {
  await cancelReminderNotifications(reminder.id);

  for (const time of reminder.times) {
    for (const day of reminder.days_of_week) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${reminder.id}-${day}-${time.hour}-${time.minute}`,
        content: {
          title: `🔔 ${reminder.title}`,
          body: time.label
            ? `Time for: ${time.label} — Submit proof to complete`
            : 'Tap to submit your proof',
          data: { reminderId: reminder.id, requiresProof: true },
          sound: 'default',
          priority: 'max',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo uses 1=Sun…7=Sat
          hour: time.hour,
          minute: time.minute,
        },
      });
    }
  }
}

export async function cancelReminderNotifications(reminderId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(reminderId)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}
