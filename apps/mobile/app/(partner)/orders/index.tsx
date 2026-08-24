import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { orderService } from '../../../services';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function PartnerOrdersScreen() {
  const [tab, setTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partner-orders', tab],
    queryFn: () => orderService.list(tab),
  });

  const orders = data?.data?.data ?? [];

  const markReadyMutation = useMutation({
    mutationFn: (orderId: string) => orderService.updateStatus(orderId, 'READY_FOR_PICKUP'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      Toast.show({
        type: 'success',
        text1: 'Order Marked Ready',
        text2: 'Customer has been notified for pickup.',
      });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Partner Orders</Text>
        <TouchableOpacity
          style={s.scanBtn}
          onPress={() => router.push('/(partner)/orders' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={16} color={Colors.primary} />
          <Text style={s.scanTxt}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((t) => {
          const isSel = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[s.tabItem, isSel && s.tabItemActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[s.tabTxt, isSel && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>No orders in {tab}</Text>
            <Text style={s.emptySub}>Incoming customer reservations will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isReady = item.orderStatus === 'READY_FOR_PICKUP';
          return (
            <View style={s.orderCard}>
              <View style={s.cardHeader}>
                <Text style={s.orderId}>Order #{item.orderNumber?.slice(-7) ?? item.id.slice(-6)}</Text>
                <View
                  style={[
                    s.statusTag,
                    isReady ? s.statusTagReady : s.statusTagConfirmed,
                  ]}
                >
                  <Text
                    style={[
                      s.statusTagTxt,
                      isReady ? s.statusTagTxtReady : s.statusTagTxtConfirmed,
                    ]}
                  >
                    {isReady ? 'Ready for Pickup' : 'Confirmed'}
                  </Text>
                </View>
              </View>

              <View style={s.cardBody}>
                <View style={s.row}>
                  <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                  <Text style={s.pickupWindow}>
                    Pickup{' '}
                    {item.bag?.pickupStart
                      ? new Date(item.bag.pickupStart).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '8:00 PM'}{' '}
                    –{' '}
                    {item.bag?.pickupEnd
                      ? new Date(item.bag.pickupEnd).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '9:00 PM'}
                  </Text>
                </View>
                <Text style={s.orderDetails}>
                  {item.quantity ?? 1} Bag · ₹{item.totalAmount ?? item.total ?? 99}
                </Text>
                <Text style={s.customerName}>Customer: {item.customer?.name || 'Verified User'}</Text>
              </View>

              <View style={s.cardFooter}>
                <TouchableOpacity
                  style={[s.readyBtn, isReady && s.readyBtnDisabled]}
                  onPress={() => !isReady && markReadyMutation.mutate(item.id)}
                  disabled={isReady}
                >
                  <Text style={[s.readyBtnTxt, isReady && s.readyBtnTxtDisabled]}>
                    {isReady ? 'Ready for Pickup' : 'Mark as Ready'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Sp.md,
    paddingVertical: 6,
    borderRadius: R.full,
  },
  scanTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.primary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Sp.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabTxt: {
    fontFamily: Font.semiBold,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
  },
  tabTxtActive: {
    color: Colors.primary,
    fontFamily: Font.bold,
  },
  list: {
    padding: Sp.base,
    gap: Sp.md,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Sp.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.base,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    gap: Sp.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: Font.bold,
    fontSize: Sz.base,
    color: Colors.textPrimary,
  },
  statusTag: {
    borderRadius: R.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusTagReady: { backgroundColor: Colors.primarySurface },
  statusTagConfirmed: { backgroundColor: '#FFF8E1' },
  statusTagTxt: { fontFamily: Font.bold, fontSize: 10 },
  statusTagTxtReady: { color: Colors.primary },
  statusTagTxtConfirmed: { color: '#F57C00' },
  cardBody: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pickupWindow: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textTertiary,
  },
  orderDetails: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  customerName: {
    fontFamily: Font.medium,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Sp.md,
    marginTop: 4,
  },
  readyBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  readyBtnDisabled: {
    backgroundColor: Colors.primarySurface,
  },
  readyBtnTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.white,
  },
  readyBtnTxtDisabled: {
    color: Colors.primary,
  },
});
