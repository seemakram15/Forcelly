import { create } from 'zustand';
import { Reminder, ReminderOccurrence } from '../types';

interface RemindersState {
  reminders: Reminder[];
  occurrences: ReminderOccurrence[];
  activeOccurrence: ReminderOccurrence | null;
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (r: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  setOccurrences: (o: ReminderOccurrence[]) => void;
  setActiveOccurrence: (o: ReminderOccurrence | null) => void;
}

export const useRemindersStore = create<RemindersState>((set) => ({
  reminders: [],
  occurrences: [],
  activeOccurrence: null,
  setReminders: (reminders) => set({ reminders }),
  addReminder: (r) => set((s) => ({ reminders: [r, ...s.reminders] })),
  updateReminder: (id, updates) =>
    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  removeReminder: (id) =>
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
  setOccurrences: (occurrences) => set({ occurrences }),
  setActiveOccurrence: (activeOccurrence) => set({ activeOccurrence }),
}));
