import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const TIER_COLORS: Record<string, [string, string]> = {
  BRONZE: ['#CD7F32', '#A0522D'],
  SILVER: ['#C0C0C0', '#808080'],
  GOLD: ['#FFD700', '#DAA520'],
  PLATINUM: ['#E5E4E2', '#8E8D8A'],
};

const TIER_NEXT: Record<string, { name: string; points: number }> = {
  BRONZE: { name: 'Silver', points: 1000 },
  SILVER: { name: 'Gold', points: 5000 },
  GOLD: { name: 'Platinum', points: 15000 },
  PLATINUM: { name: 'Max', points: 999999 },
};

export default function HomeScreen({ navigation }: any) {
  const { user, balance, setBalance } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [balRes, txRes, chRes] = await Promise.all([
        api.points.getBalance(),
        api.points.getTransactions(1, 5),
        api.gamification.getChallenges(),
      ]);
      setBalance(balRes.data.balance);
      setRecentTransactions(txRes.data.transactions || []);
      setChallenges((chRes.data.challenges || []).slice(0, 3));
    } catch (e) {
      console.error('HomeScreen load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const tier = user?.tier || 'BRONZE';
  const colors = TIER_COLORS[tier] || TIER_COLORS.BRONZE;
  const totalPoints = user?.totalPoints || 0;
  const nextTier = TIER_NEXT[tier];
  const progress = tier === 'PLATINUM' ? 1 : totalPoints / nextTier.points;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Points Card */}
      <LinearGradient colors={colors} style={styles.pointsCard}>
        <Text style={styles.tierBadge}>{tier}</Text>
        <Text style={styles.pointsLabel}>Available Points</Text>
        <Text style={styles.pointsValue}>{(balance || 0).toLocaleString()}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          {tier !== 'PLATINUM' ? (
            <Text style={styles.progressText}>
              {totalPoints.toLocaleString()} / {nextTier.points.toLocaleString()} to {nextTier.name}
            </Text>
          ) : (
            <Text style={styles.progressText}>Maximum Tier Reached! 🎉</Text>
          )}
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '📅', label: 'Check In', onPress: () => handleCheckin() },
            { icon: '🎰', label: 'Spin Wheel', onPress: () => navigation.navigate('Gamification') },
            { icon: '🎁', label: 'Rewards', onPress: () => navigation.navigate('Rewards') },
            { icon: '🏆', label: 'Leaderboard', onPress: () => navigation.navigate('Leaderboard') },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={action.onPress}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Gamification')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {challenges.map((ch: any) => (
            <View key={ch.id} style={styles.challengeCard}>
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeName}>{ch.name}</Text>
                <Text style={styles.challengeReward}>🏅 {ch.pointReward} pts</Text>
              </View>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeBar}>
                  <View
                    style={[
                      styles.challengeFill,
                      { width: `${ch.target ? (ch.currentProgress / ch.target) * 100 : 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.challengeCount}>
                  {ch.currentProgress || 0}/{ch.target}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          recentTransactions.map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[styles.txAmount, { color: tx.type === 'EARN' ? '#22C55E' : '#EF4444' }]}
              >
                {tx.type === 'EARN' ? '+' : '-'}
                {tx.amount}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );

  async function handleCheckin() {
    try {
      const res = await api.gamification.checkIn();
      const pts = res.data.pointsEarned || 10;
      alert(`✅ Checked in! +${pts} points\nStreak: ${res.data.streak || 1} days`);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Already checked in today!');
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pointsCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
    overflow: 'hidden',
  },
  pointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 12 },
  pointsValue: { color: '#FFF', fontSize: 48, fontWeight: '800', marginVertical: 4 },
  progressContainer: { width: '100%', marginTop: 12 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center', marginTop: 6 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  seeAll: { color: '#6C63FF', fontWeight: '600', fontSize: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  actionCard: {
    width: (width - 56) / 4,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginTop: 6, textAlign: 'center' },
  challengeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  challengeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  challengeName: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  challengeReward: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },
  challengeProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  challengeBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 3 },
  challengeCount: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  txDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 20 },
});
