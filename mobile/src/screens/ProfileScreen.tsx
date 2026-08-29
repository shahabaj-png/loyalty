import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Image, Switch,
} from 'react-native';
import { useStore } from '../store';
import { api } from '../services/api';

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFD700', PLATINUM: '#E5E4E2',
};

const TIER_NEXT: Record<string, { name: string; points: number }> = {
  BRONZE: { name: 'Silver', points: 1000 },
  SILVER: { name: 'Gold', points: 5000 },
  GOLD: { name: 'Platinum', points: 15000 },
  PLATINUM: { name: 'Max', points: 0 },
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useStore();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const tier = user?.tier || 'BRONZE';
  const tierColor = TIER_COLORS[tier];
  const nextTier = TIER_NEXT[tier];
  const progress = nextTier.points > 0
    ? Math.min(((user?.totalPoints || 0) / nextTier.points) * 100, 100)
    : 100;

  const handleSave = async () => {
    try {
      await api.users.updateProfile({ firstName, lastName, phone });
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: tierColor }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{tier} MEMBER</Text>
        </View>
      </View>

      {/* Tier Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tier Progress</Text>
        <View style={styles.tierCard}>
          <View style={styles.tierRow}>
            <Text style={styles.tierLabel}>{tier}</Text>
            {nextTier.points > 0 && <Text style={styles.tierLabel}>{nextTier.name}</Text>}
          </View>
          <View style={styles.tierProgressBar}>
            <View style={[styles.tierProgressFill, { width: `${progress}%`, backgroundColor: tierColor }]} />
          </View>
          {nextTier.points > 0 ? (
            <Text style={styles.tierInfo}>
              {nextTier.points - (user?.totalPoints || 0)} more points to {nextTier.name}
            </Text>
          ) : (
            <Text style={styles.tierInfo}>🎉 You've reached the highest tier!</Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Points', value: user?.totalPoints?.toLocaleString() || '0', icon: '💎' },
            { label: 'Available', value: user?.availablePoints?.toLocaleString() || '0', icon: '✨' },
            { label: 'Streak', value: `${user?.streakDays || 0} days`, icon: '🔥' },
            { label: 'Rewards', value: user?.rewardsCount?.toString() || '0', icon: '🎁' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Edit Profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
            <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>First Name</Text>
            {editing ? (
              <TextInput style={styles.formInput} value={firstName} onChangeText={setFirstName} />
            ) : (
              <Text style={styles.formValue}>{user?.firstName}</Text>
            )}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Last Name</Text>
            {editing ? (
              <TextInput style={styles.formInput} value={lastName} onChangeText={setLastName} />
            ) : (
              <Text style={styles.formValue}>{user?.lastName}</Text>
            )}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Phone</Text>
            {editing ? (
              <TextInput style={styles.formInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            ) : (
              <Text style={styles.formValue}>{user?.phone || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Email</Text>
            <Text style={styles.formValue}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        {[
          { label: 'Transaction History', icon: '📊', screen: 'Transactions' },
          { label: 'Identity Verification', icon: '🆔', screen: 'Identity' },
          { label: 'Notifications', icon: '🔔', screen: 'Notifications' },
        ].map((link, i) => (
          <TouchableOpacity key={i} style={styles.linkRow} onPress={() => navigation.navigate(link.screen)}>
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <Text style={styles.linkText}>{link.label}</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 30, alignItems: 'center', paddingTop: 50 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  name: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 12 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tierBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  tierText: { color: '#FFF', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  editBtn: { color: '#6366F1', fontWeight: '600' },
  tierCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tierLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tierProgressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginVertical: 10 },
  tierProgressFill: { height: 8, borderRadius: 4 },
  tierInfo: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10, elevation: 2 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  formCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  formLabel: { fontSize: 14, color: '#6B7280' },
  formValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  formInput: { fontSize: 14, color: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#6366F1', paddingVertical: 2, minWidth: 150, textAlign: 'right' },
  linkRow: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  linkIcon: { fontSize: 20, marginRight: 12 },
  linkText: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500' },
  linkArrow: { fontSize: 22, color: '#9CA3AF' },
  settingRow: { backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
  settingLabel: { fontSize: 15, color: '#1F2937' },
  logoutBtn: { marginHorizontal: 16, marginTop: 24, backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
