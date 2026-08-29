import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Animated, Dimensions,
} from 'react-native';
import { useStore } from '../store';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export default function GamificationScreen({ navigation }: any) {
  const { user, challenges, badges, fetchChallenges, fetchBadges } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'challenges' | 'badges' | 'spin'>('challenges');
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const spinAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchChallenges();
    fetchBadges();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchChallenges(), fetchBadges()]);
    setRefreshing(false);
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await api.gamification.checkIn();
      setCheckedIn(true);
      Alert.alert('Checked In!', `+${res.pointsEarned} points\nStreak: ${res.streakDays} days`);
    } catch (e: any) {
      Alert.alert('Already Checked In', e?.response?.data?.message || 'Try again tomorrow!');
    }
  };

  const handleJoinChallenge = async (id: string) => {
    try {
      await api.gamification.joinChallenge(id);
      fetchChallenges();
      Alert.alert('Joined!', 'Challenge accepted. Good luck!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not join challenge');
    }
  };

  const handleSpin = async () => {
    if (!canSpin) return;
    try {
      setCanSpin(false);
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
      const res = await api.gamification.spin();
      setTimeout(() => {
        setSpinResult(res.pointsWon);
        Alert.alert('🎉 You Won!', `+${res.pointsWon} points!`);
        spinAnim.setValue(0);
      }, 2000);
    } catch (e: any) {
      setCanSpin(true);
      spinAnim.setValue(0);
      Alert.alert('Cannot Spin', e?.response?.data?.message || 'Try again later');
    }
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg'],
  });

  const renderChallenges = () => (
    <View>
      {challenges.length === 0 ? (
        <Text style={styles.emptyText}>No challenges available right now.</Text>
      ) : (
        challenges.map((c: any) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <View style={[styles.badge, { backgroundColor: c.userJoined ? '#10B981' : '#6366F1' }]}>
                <Text style={styles.badgeText}>
                  {c.userJoined ? `${c.userProgress || 0}/${c.targetValue}` : `+${c.rewardPoints} pts`}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{c.description}</Text>
            {c.userJoined && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(((c.userProgress || 0) / c.targetValue) * 100, 100)}%` }]} />
              </View>
            )}
            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                Ends: {new Date(c.endDate).toLocaleDateString()}
              </Text>
              {!c.userJoined && (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinChallenge(c.id)}>
                  <Text style={styles.joinBtnText}>Join Challenge</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderBadges = () => (
    <View style={styles.badgesGrid}>
      {badges.length === 0 ? (
        <Text style={styles.emptyText}>No badges earned yet. Keep going!</Text>
      ) : (
        badges.map((b: any) => (
          <View key={b.id} style={[styles.badgeCard, !b.earned && styles.badgeCardLocked]}>
            <Text style={styles.badgeIcon}>{b.icon || '🏅'}</Text>
            <Text style={styles.badgeName}>{b.name}</Text>
            <Text style={styles.badgeCriteria}>{b.description}</Text>
            {b.earned && (
              <Text style={styles.badgeEarned}>✅ Earned</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderSpinWheel = () => (
    <View style={styles.spinContainer}>
      <Text style={styles.spinTitle}>Daily Spin Wheel</Text>
      <Text style={styles.spinSubtitle}>Spin once per day for bonus points!</Text>
      <Animated.View style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}>
        <Text style={styles.wheelText}>🎰</Text>
        {['10', '25', '50', '100', '250', '500', '1000'].map((val, i) => (
          <Text key={i} style={[styles.wheelSegment, { transform: [{ rotate: `${i * 51.4}deg` }] }]}>
            {val}
          </Text>
        ))}
      </Animated.View>
      {spinResult !== null && (
        <Text style={styles.spinResultText}>Last spin: +{spinResult} points!</Text>
      )}
      <TouchableOpacity
        style={[styles.spinBtn, !canSpin && styles.spinBtnDisabled]}
        onPress={handleSpin}
        disabled={!canSpin}
      >
        <Text style={styles.spinBtnText}>{canSpin ? 'SPIN!' : 'Spinning...'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Daily Check-In */}
      <TouchableOpacity
        style={[styles.checkInBar, checkedIn && styles.checkInBarDone]}
        onPress={handleCheckIn}
        disabled={checkedIn}
      >
        <Text style={styles.checkInText}>
          {checkedIn ? '✅ Checked in today!' : '📅 Tap to check in today'}
        </Text>
        {user?.streakDays > 0 && (
          <Text style={styles.streakText}>🔥 {user.streakDays} day streak</Text>
        )}
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['challenges', 'badges', 'spin'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'challenges' ? '🏆 Challenges' : t === 'badges' ? '🏅 Badges' : '🎰 Spin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {tab === 'challenges' && renderChallenges()}
        {tab === 'badges' && renderBadges()}
        {tab === 'spin' && renderSpinWheel()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  checkInBar: {
    backgroundColor: '#6366F1', margin: 16, padding: 16,
    borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  checkInBarDone: { backgroundColor: '#10B981' },
  checkInText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  streakText: { color: '#FFF', fontSize: 14 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#FFF' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cardDesc: { color: '#6B7280', fontSize: 14, marginTop: 8 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 12 },
  progressFill: { height: 6, backgroundColor: '#10B981', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dateText: { color: '#9CA3AF', fontSize: 12 },
  joinBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeCard: {
    width: (width - 48) / 2, backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, marginBottom: 12, alignItems: 'center', elevation: 2,
  },
  badgeCardLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 40 },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 8, textAlign: 'center' },
  badgeCriteria: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  badgeEarned: { fontSize: 12, color: '#10B981', marginTop: 6, fontWeight: '600' },
  spinContainer: { alignItems: 'center', paddingVertical: 20 },
  spinTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  spinSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  wheel: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center', marginVertical: 30, elevation: 5,
  },
  wheelText: { fontSize: 60 },
  wheelSegment: { position: 'absolute', color: '#FFF', fontSize: 12, fontWeight: '700' },
  spinResultText: { fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 16 },
  spinBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
  spinBtnDisabled: { backgroundColor: '#9CA3AF' },
  spinBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, paddingVertical: 40 },
});
