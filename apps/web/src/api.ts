export type Channel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';
export type Status = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface DeliveryAttempt {
  id: string;
  attemptNumber: number;
  provider: string;
  success: boolean;
  providerMessageId?: string | null;
  responseCode?: number | null;
  errorMessage?: string | null;
  durationMs: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  channel: Channel;
  recipient: string;
  subject?: string | null;
  body: string;
  priority: Priority;
  status: Status;
  attemptsCount: number;
  lastError?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  attempts: DeliveryAttempt[];
}

export interface NotificationStats {
  total: number;
  delivered: number;
  failed: number;
  queued: number;
  processing: number;
  byChannel: Record<Channel, number>;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export async function fetchNotifications(filters?: {
  status?: string;
  channel?: string;
}): Promise<NotificationItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.channel) params.set('channel', filters.channel);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/notifications${query}`);
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json();
}

export async function fetchStats(): Promise<NotificationStats> {
  const res = await fetch(`${API_BASE}/notifications/stats`);
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function sendNotification(payload: {
  channel: Channel;
  recipient: string;
  subject?: string;
  body: string;
  priority: Priority;
}): Promise<NotificationItem> {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to send notification');
  }
  return res.json();
}

export async function retryNotification(id: string): Promise<NotificationItem> {
  const res = await fetch(`${API_BASE}/notifications/${id}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry notification');
  return res.json();
}
