import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { useStore } from '../store';

type Transaction = {
  id: string; type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number; description: string; createdAt: string;
  source?: string; metadata?: any;
};

type Filter = 'ALL' | 'EARN' | 'REDEEM';

export default function TransactionsScreen() {
  const { user } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadTransactions = async (pageNum = 1, append = false) => {
    try {
      const res = await api.points.getTransactions({ page: pageNum, limit: 20, type: filter === 'ALL' ? undefined : filter });
      const items = res.data || res;
      if (append) {
        setTransactions(prev => [...prev, ...items]);
      } else {
        setTransactions(items);
      }
      setHasMore(items.length === 20);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadTransactions(1);
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadTransactions(1);
  }, [filter]);

  const onEndReached = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadTransactions(nextPage, true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EARN': return '💰';
      case 'REDEEM': return '🎁';
      case 'EXPIRE': return '⏰';
      case 'ADJUST': return '🔧';
      default: return '📋';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'EARN': return '#10B981';
      case 'REDEEM': return '#EF4444';
      case 'EXPIRE': return '#F59E0B';
      case 'ADJUST': return '#6366F1';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.row}>
      <Text style={styles.icon}>{getIcon(item.type)}</Text>
      <View style={styles.info}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()} · {item.source || item.type}
        </Text>
      </View>
      <Text style={[styles.points, { color: getColor(item.type) }]}>
        {item.type === 'EARN' || item.type === 'ADJUST' ? '+' : '-'}
        {Math.abs(item.points).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Balance Header */}
      <View style={styles.header}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>{(user?.availablePoints || 0).toLocaleString()} pts</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['ALL', 'EARN', 'REDEEM'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f === 'EARN' ? 'Earned' : 'Redeemed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      {loading && transactions.length === 0 ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions yet.</Text>
          }
          ListFooterComponent={
            hasMore && transactions.length > 0 ? (
              <ActivityIndicator size="small" color="#6366F1" style={{ paddingVertical: 20 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#6366F1', padding: 24, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceValue: { color: '#FFF', fontSize: 32, fontWeight: '700', marginTop: 4 },
  filters: { flexDirection: 'row', margin: 16, backgroundColor: '#FFF', borderRadius: 10, padding: 4 },
  filterBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: '#6366F1' },
  filterText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1,
  },
  icon: { fontSize: 24, marginRight: 12 },
  info: { flex: 1 },
  desc: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  points: { fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, paddingVertical: 40 },
});
