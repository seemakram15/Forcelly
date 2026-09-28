export type ReminderCategory =
  | 'prayer'
  | 'health'
  | 'fitness'
  | 'study'
  | 'work'
  | 'habit'
  | 'custom';

export interface ReminderTime {
  hour: number;
  minute: number;
  label?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  times: ReminderTime[];
  days_of_week: number[]; // 0=Sun … 6=Sat
  is_active: boolean;
  proof_required: boolean;
  created_at: string;
}

export interface ReminderOccurrence {
  id: string;
  reminder_id: string;
  reminder?: Reminder;
  scheduled_at: string;
  status: 'pending' | 'snoozed' | 'completed' | 'missed';
  proof_url?: string;
  completed_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  score: number;
  total_completed: number;
  total_missed: number;
  created_at: string;
}
