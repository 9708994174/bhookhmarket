import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { orderService } from '../../../services';
import { OrderCardSkeleton } from '../../../components/Skeletons';

const TABS = [
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING_PAYMENT:  { label: 'Payment Pending', color: '#F59E0B', icon: 'time-outline' },
  CONFIRMED:        { label: 'Confirmed',        color: '#2E7D32', icon: 'checkmark-circle-outline' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#1B5E20', icon: 'cube-outline' },
  PICKED_UP:        { label: 'Picked Up',        color: '#1565C0', icon: 'bag-check-outline' },
  COMPLETED:        { label: 'Completed',        color: '#2E7D32', icon: 'checkmark-done-circle-outline' },
  CANCELLED:        { label: 'Cancelled',        color: '#C62828', icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const [tab, setTab] = useState('upcoming');
  const [refreshing, setRef] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', tab],
    queryFn: () => orderService.list(tab),
    staleTime: 10_000,
  });
  const orders = data?.data?.data ?? data?.data ?? [];

  const onRefresh = async () => {
    setRef(true);
    await refetch();
    setRef(false);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Orders</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, tab === t.id && s.tabActive]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, tab === t.id && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ padding: Sp.base, gap: Sp.base }}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="receipt-text-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>
                {tab === 'upcoming'
                  ? 'No upcoming orders'
                  : tab === 'completed'
                  ? 'No completed orders'
                  : 'No cancelled orders'}
              </Text>
              <Text style={s.emptySub}>
                {tab === 'upcoming'
                  ? 'Explore and rescue a Surprise Bag today!'
                  : 'Your order history will appear here.'}
              </Text>
              {tab === 'upcoming' && (
                <TouchableOpacity style={s.exploreCta} onPress={() => router.push('/(consumer)/(tabs)')} activeOpacity={0.85}>
                  <Text style={s.exploreCtaTxt}>Explore Surprise Bags</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CFG[item.orderStatus] ?? STATUS_CFG.CONFIRMED;
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/(consumer)/orders/${item.id}`)}
                activeOpacity={0.9}
              >
                {/* Left image */}
                <View style={s.cardImg}>
                  {item.bag?.imageUrl ? (
                    <Image source={{ uri: item.bag.imageUrl }} style={s.cardImgImg} resizeMode="cover" />
                  ) : (
                    <View style={s.cardImgPlaceholder}>
                      <MaterialCommunityIcons name="shopping" size={28} color={Colors.primary} />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.cardInfo}>
                  <View style={s.cardTop}>
                    <Text style={s.storeName} numberOfLines={1}>
                      {item.bag?.partner?.businessName ?? 'Partner Store'}
                    </Text>
                    <Text style={s.price}>₹{item.totalAmount}</Text>
                  </View>

                  <Text style={s.bagTitle} numberOfLines={1}>
                    {item.bag?.title ?? 'Surprise Bag'}
                  </Text>

                  <View style={s.pickupRow}>
                    <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                    <Text style={s.pickupTime}>
                      {item.bag?.pickupStart && item.bag?.pickupEnd
                        ? `Pickup: ${fmt(item.bag.pickupStart)} – ${fmt(item.bag.pickupEnd)}`
                        : 'Today'}
                    </Text>
                  </View>

                  <View style={s.cardBottom}>
                    <View style={[s.badge, { backgroundColor: cfg.color + '14' }]}>
                      <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                      <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    <View style={s.chevronRow}>
                      <Text style={s.codeTxt}>Code: {item.pickupCode ?? '••••'}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.gray400} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontFamily: Font.extraBold, fontSize: Sz.xl, color: Colors.textPrimary, textAlign: 'center' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Sp.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabTxt: { fontFamily: Font.medium, fontSize: Sz.sm, color: Colors.textSecondary },
  tabTxtActive: { fontFamily: Font.bold, color: Colors.primary },
  list: { padding: Sp.base, gap: Sp.base, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  cardImg: { width: 72, height: 72, borderRadius: R.lg, overflow: 'hidden' },
  cardImgImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  storeName: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary, flex: 1 },
  price: { fontFamily: Font.extraBold, fontSize: Sz.sm, color: Colors.primary },
  bagTitle: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.textSecondary, marginBottom: 4 },
  pickupRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pickupTime: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textSecondary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.sm },
  badgeTxt: { fontFamily: Font.bold, fontSize: 10 },
  chevronRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  codeTxt: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.textTertiary },
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: Sp.xl },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.base,
  },
  emptyTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textSecondary, textAlign: 'center', marginBottom: Sp.lg },
  exploreCta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: R.lg,
  },
  exploreCtaTxt: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.white },
});
