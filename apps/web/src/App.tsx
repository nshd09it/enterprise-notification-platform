import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchNotifications,
  fetchStats,
  retryNotification,
  sendNotification,
  type Channel,
  type NotificationItem,
  type NotificationStats,
  type Priority,
} from './api';

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
  QUEUED: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-sky-100 text-sky-800',
  PENDING: 'bg-slate-100 text-slate-700',
};

export default function App() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer form state
  const [channel, setChannel] = useState<Channel>('EMAIL');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [items, metrics] = await Promise.all([
        fetchNotifications({
          channel: channelFilter || undefined,
          status: statusFilter || undefined,
        }),
        fetchStats(),
      ]);
      setNotifications(items);
      setStats(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to API');
    }
  }, [channelFilter, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => void loadData(), 4000);
    return () => clearInterval(id);
  }, [autoRefresh, loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await sendNotification({
        channel,
        priority,
        recipient,
        subject: subject.trim() || undefined,
        body,
      });
      setRecipient('');
      setSubject('');
      setBody('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryNotification(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Enterprise Notification Platform
            </h1>
            <p className="text-sm text-slate-500">
              Multi-channel dispatch powered by NestJS, PostgreSQL/Prisma, and Redis/BullMQ
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-300"
            />
            Auto-refresh (4s)
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={stats?.total ?? 0} />
          <StatCard label="Delivered" value={stats?.delivered ?? 0} accent="text-emerald-600" />
          <StatCard
            label="Queued / Processing"
            value={(stats?.queued ?? 0) + (stats?.processing ?? 0)}
            accent="text-amber-600"
          />
          <StatCard label="Failed" value={stats?.failed ?? 0} accent="text-rose-600" />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Composer */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Send Notification
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as Channel)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="PUSH">Push</option>
                    <option value="WEBHOOK">Webhook</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Recipient
                </label>
                <input
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={
                    channel === 'EMAIL'
                      ? 'user@example.com'
                      : channel === 'SMS'
                        ? '+919876543210'
                        : channel === 'WEBHOOK'
                          ? 'https://webhook.site/...'
                          : 'device-token-abc123'
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Subject (optional)
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order confirmation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter notification content..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Enqueuing...' : 'Enqueue Notification'}
              </button>
            </form>
          </section>

          {/* Delivery Log */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Delivery Log
              </h2>
              <div className="flex gap-2">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                >
                  <option value="">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PUSH">Push</option>
                  <option value="WEBHOOK">Webhook</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="QUEUED">Queued</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No notifications found. Send one from the form to see it processed in real time.
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {item.channel}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[item.status] ?? 'bg-slate-100'}`}
                        >
                          {item.status}
                        </span>
                        <span className="font-medium text-slate-900">
                          {item.recipient}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        {item.status === 'FAILED' && (
                          <button
                            onClick={() => void handleRetry(item.id)}
                            className="rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>

                    {item.subject && (
                      <p className="mt-1.5 font-medium text-slate-800">
                        {item.subject}
                      </p>
                    )}
                    <p className="mt-1 text-slate-600">{item.body}</p>

                    {item.lastError && (
                      <p className="mt-2 rounded bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                        Last error: {item.lastError}
                      </p>
                    )}

                    {item.attempts.length > 0 && (
                      <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                        Attempts: {item.attempts.length} (latest via{' '}
                        <span className="font-mono">{item.attempts[0].provider}</span> in{' '}
                        {item.attempts[0].durationMs}ms)
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'text-slate-900',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
