import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, FlatList,
} from 'react-native';
import { useStore } from '../store';
import { api } from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { user, leaderboard, fetchLeaderboard } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'monthly' | 'allTime'>('monthly');
  const [myRank, setMyRank] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    await fetchLeaderboard(period);
    try {
      const rank = await api.gamification.getMyRank(period);
      setMyRank(rank);
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [period]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.userId === user?.id;
    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <View style={styles.rankCol}>
          {index < 3 ? (
            <Text style={styles.medal}>{MEDALS[index]}</Text>
          ) : (
            <Text style={styles.rankNum}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.userCol}>
          <View style={[styles.avatar, isMe && styles.avatarMe]}>
            <Text style={styles.avatarText}>
              {(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, isMe && styles.userNameMe]}>
              {item.firstName} {item.lastName} {isMe ? '(You)' : ''}
            </Text>
            <Text style={styles.userTier}>{item.tier}</Text>
          </View>
        </View>
        <Text style={[styles.points, isMe && styles.pointsMe]}>
          {item.points?.toLocaleString()} pts
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Period Toggle */}
      <View style={styles.toggleContainer}>
        {(['monthly', 'allTime'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.toggle, period === p && styles.toggleActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {p === 'monthly' ? 'This Month' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Rank Card */}
      {myRank && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>Your Rank</Text>
          <Text style={styles.myRankValue}>#{myRank.rank}</Text>
          <Text style={styles.myRankPoints}>{myRank.points?.toLocaleString()} points</Text>
        </View>
      )}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        keyExtractor={(item, i) => item.userId || i.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No leaderboard data yet. Start earning points!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  toggleContainer: { flexDirection: 'row', margin: 16, backgroundColor: '#FFF', borderRadius: 10, padding: 4 },
  toggle: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#6366F1' },
  toggleText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  toggleTextActive: { color: '#FFF' },
  myRankCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#6366F1',
    borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  myRankLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  myRankValue: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  myRankPoints: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1,
  },
  rowMe: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#6366F1' },
  rankCol: { width: 40, alignItems: 'center' },
  medal: { fontSize: 24 },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
  userCol: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarMe: { backgroundColor: '#6366F1' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  userName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  userNameMe: { color: '#6366F1' },
  userTier: { fontSize: 12, color: '#9CA3AF' },
  points: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  pointsMe: { color: '#6366F1' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, paddingVertical: 40 },
});
