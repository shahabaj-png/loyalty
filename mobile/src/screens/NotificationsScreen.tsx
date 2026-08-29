import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

type Notification = {
  id: string; title: string; message: string; type: string;
  read: boolean; createdAt: string; metadata?: any;
};

const ICONS: Record<string, string> = {
  POINTS_EARNED: '💰', TIER_UPGRADE: '⬆️', REWARD_AVAILABLE: '🎁',
  CHALLENGE_COMPLETE: '🏆', BADGE_EARNED: '🏅', IDENTITY_VERIFIED: '✅',
  SYSTEM: '📢', DEFAULT: '🔔',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.users.getNotifications();
      setNotifications(res.data || res || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.users.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.users.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => !item.read && markRead(item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{ICONS[item.type] || ICONS.DEFAULT}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates about points, rewards, and challenges here.</Text>
          </View>
        }
      />
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  unreadLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  markAllBtn: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1,
  },
  rowUnread: { backgroundColor: '#EEF2FF', borderLeftWidth: 3, borderLeftColor: '#6366F1' },
  icon: { fontSize: 28, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: '#1F2937' },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366F1', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', maxWidth: '80%' },
});
