import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import keycloak from '../keycloak';
import type { Notification } from '../types';

const WS_URL = (import.meta.env.VITE_NOTIFICATION_WS_URL as string | undefined) ?? 'http://localhost:3003';

// Mock fallback notifications for demo resilience
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: 'mock-1',
    userId: 'demo',
    documentId: 'doc-1',
    filename: 'facture_fournisseur_2024.pdf',
    decision: 'APPROVED',
    validatorName: 'Bob Validator',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    _id: 'mock-2',
    userId: 'demo',
    documentId: 'doc-2',
    filename: 'attestation_urssaf_q4.pdf',
    decision: 'REJECTED',
    validatorName: 'Bob Validator',
    read: false,
    createdAt: new Date(Date.now() - 18 * 60_000).toISOString(),
  },
  {
    _id: 'mock-3',
    userId: 'demo',
    documentId: 'doc-3',
    filename: 'kbis_societe_abc.pdf',
    decision: 'APPROVED',
    validatorName: 'Charlie Admin',
    read: true,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingToast, setPendingToast] = useState<Notification | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const userId = keycloak.tokenParsed?.sub as string | undefined;

  // Fetch existing notifications on mount
  useEffect(() => {
    if (!userId) {
      setNotifications(MOCK_NOTIFICATIONS);
      return;
    }
    api
      .get<{ notifications: Notification[] }>(`/notifications?userId=${userId}`)
      .then(res => {
        if (res.data.notifications.length > 0) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications(MOCK_NOTIFICATIONS);
        }
      })
      .catch(() => setNotifications(MOCK_NOTIFICATIONS));
  }, [userId]);

  // WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const socket = io(WS_URL, {
      auth: { userId },
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification:new', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setPendingToast(notif);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n)),
      );
      if (userId) {
        await api
          .patch(`/notifications/${notificationId}/read?userId=${userId}`)
          .catch(() => {});
      }
    },
    [userId],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (userId) {
      await api.patch(`/notifications/read-all?userId=${userId}`).catch(() => {});
    }
  }, [userId]);

  const clearToast = useCallback(() => setPendingToast(null), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, pendingToast, connected, markAsRead, markAllAsRead, clearToast };
}
