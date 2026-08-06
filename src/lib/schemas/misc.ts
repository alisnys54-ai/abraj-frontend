export interface MeProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_system_owner: boolean;
  must_change_password: boolean;
  notification_prefs: Record<string, unknown>;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  role: { id: string; name: string } | null;
  permissions: { module: string; action: string; scope: 'all' | 'department' | 'own' }[];
}

export interface NotificationRow {
  id: string;
  task_id?: string | null;
  event_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
