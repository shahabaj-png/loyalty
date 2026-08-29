import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store';
import { api } from '../services/api';

export default function RewardDetailScreen({ route, navigation }: any) {
  const { reward } = route.params;
  const { balance, setBalance } = useStore();
  const [redeeming, setRedeeming] = useState(false);
  const canAfford = (balance || 0) >= reward.pointsCost;
  const inStock = reward.stock === null || reward.stock === undefined || reward.stock > 0;

  const handleRedeem = () => {
    if (!canAfford) {
      Alert.alert('Insufficient Points', `You need ${reward.pointsCost - (balance || 0)} more points.`);
      return;
    }
    if (!inStock) {
      Alert.alert('Sold Out', 'This reward is no longer available.');
      return;
    }
    Alert.alert(
      'Redeem Reward',
      `Spend ${reward.pointsCost.toLocaleString()} points for "${reward.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeeming(true);
            try {
              await api.rewards.redeem(reward.id);
              const balRes = await api.points.getBalance();
              setBalance(balRes.data.balance);
              Alert.alert('🎉 Redeemed!', `You've successfully redeemed "${reward.name}".`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Redemption failed');
            } finally {
              setRedeeming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {reward.imageUrl ? (
          <Image source={{ uri: reward.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroIcon}>🎁</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.category}>{reward.category || 'REWARD'}</Text>
            {reward.featured && <Text style={styles.featured}>⭐ Featured</Text>}
          </View>

          <Text style={styles.name}>{reward.name}</Text>
          <Text style={styles.cost}>{reward.pointsCost.toLocaleString()} points</Text>

          <View style={styles.divider} />

          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.description}>{reward.description}</Text>

          {reward.terms && (
            <>
              <Text style={styles.descTitle}>Terms & Conditions</Text>
              <Text style={styles.terms}>{reward.terms}</Text>
            </>
          )}

          <View style={styles.metaRow}>
            {reward.stock !== null && reward.stock !== undefined && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Stock</Text>
                <Text style={styles.metaValue}>
                  {reward.stock > 0 ? `${reward.stock} remaining` : 'Sold Out'}
                </Text>
              </View>
            )}
            {reward.expiresAt && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expires</Text>
                <Text style={styles.metaValue}>
                  {new Date(reward.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerBalance}>
          <Text style={styles.footerLabel}>Your Balance</Text>
          <Text style={styles.footerValue}>{(balance || 0).toLocaleString()} pts</Text>
        </View>
        <TouchableOpacity
          style={[styles.redeemBtn, (!canAfford || !inStock) && styles.redeemBtnDisabled]}
          onPress={handleRedeem}
          disabled={redeeming || !canAfford || !inStock}
        >
          {redeeming ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.redeemText}>
              {!inStock ? 'Sold Out' : !canAfford ? 'Not Enough Points' : 'Redeem Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  heroImage: { width: '100%', height: 250, resizeMode: 'cover' },
  heroPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: { fontSize: 80 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C63FF',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  featured: { fontSize: 13, color: '#DAA520', fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  cost: { fontSize: 20, fontWeight: '700', color: '#6C63FF', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  descTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  terms: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 4, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 20, marginTop: 20 },
  metaItem: {},
  metaLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  metaValue: { fontSize: 14, color: '#1F2937', fontWeight: '600', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  footerBalance: { flex: 1 },
  footerLabel: { fontSize: 12, color: '#9CA3AF' },
  footerValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  redeemBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  redeemBtnDisabled: { backgroundColor: '#D1D5DB' },
  redeemText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
