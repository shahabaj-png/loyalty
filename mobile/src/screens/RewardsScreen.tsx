import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store';
import { api } from '../services/api';

const CATEGORY_ICONS: Record<string, string> = {
  ALL: '🏷️',
  DISCOUNT: '💰',
  FREEBIE: '🎁',
  EXPERIENCE: '✨',
  MERCHANDISE: '👕',
  DIGITAL: '📱',
};

export default function RewardsScreen({ navigation }: any) {
  const { balance } = useStore();
  const [rewards, setRewards] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['ALL']);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRewards = useCallback(async () => {
    try {
      const [catRes, rewRes] = await Promise.all([
        api.rewards.getCategories(),
        api.rewards.getCatalog(1, 50, selectedCategory === 'ALL' ? undefined : selectedCategory),
      ]);
      setCategories(['ALL', ...(catRes.data.categories || [])]);
      setRewards(rewRes.data.rewards || []);
    } catch (e) {
      console.error('Load rewards error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRewards();
    setRefreshing(false);
  };

  const renderReward = ({ item }: any) => {
    const canAfford = (balance || 0) >= item.pointsCost;
    return (
      <TouchableOpacity
        style={styles.rewardCard}
        onPress={() => navigation.navigate('RewardDetail', { reward: item })}
      >
        <View style={styles.rewardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} />
          ) : (
            <View style={styles.rewardPlaceholder}>
              <Text style={styles.placeholderIcon}>🎁</Text>
            </View>
          )}
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.rewardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.rewardFooter}>
            <Text style={[styles.rewardCost, !canAfford && styles.rewardCostDisabled]}>
              {item.pointsCost.toLocaleString()} pts
            </Text>
            {item.stock !== null && item.stock !== undefined && (
              <Text style={styles.stockText}>
                {item.stock > 0 ? `${item.stock} left` : 'Sold out'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Balance Header */}
      <View style={styles.balanceBar}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceValue}>{(balance || 0).toLocaleString()} pts</Text>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item] || '📦'}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />

      {/* Rewards Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rewards}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No rewards available in this category</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  categoryList: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  categoryIcon: { fontSize: 14, marginRight: 6 },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  categoryTextActive: { color: '#FFF' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16 },
  gridContent: { paddingBottom: 20 },
  rewardCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '48%',
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  rewardImageContainer: { position: 'relative' },
  rewardImage: { width: '100%', height: 120, resizeMode: 'cover' },
  rewardPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: { fontSize: 40 },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: { fontSize: 10, fontWeight: '700', color: '#1F2937' },
  rewardInfo: { padding: 12 },
  rewardName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  rewardDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  rewardCost: { fontSize: 15, fontWeight: '800', color: '#6C63FF' },
  rewardCostDisabled: { color: '#D1D5DB' },
  stockText: { fontSize: 11, color: '#9CA3AF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 },
});
