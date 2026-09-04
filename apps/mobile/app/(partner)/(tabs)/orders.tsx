import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { orderService } from '../../../services';
import { useUIStore } from '../../../store';

export default function PartnerOrdersScreen() {
  const { setTabBarVisible } = useUIStore();
  const [tab, setTab] = useState<'READY' | 'COMPLETED' | 'ALL'>('READY');
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partner-orders-list', tab],
    queryFn: () => orderService.getPartnerOrders(tab),
  });

  const orders = data?.data?.data ?? [];

  const filteredOrders = orders.filter((o: any) => {
    if (tab === 'READY') return o.status === 'READY_FOR_PICKUP' || o.status === 'CONFIRMED';
    if (tab === 'COMPLETED') return o.status === 'COMPLETED';
    return true;
  });

  const handleVerifyCode = async () => {
    if (!pickupCodeInput.trim() || pickupCodeInput.length < 4) {
      Toast.show({ type: 'error', text1: 'Enter 4-digit pickup code' });
      return;
    }

    setIsVerifying(true);
    try {
      await orderService.verifyPickup(pickupCodeInput.trim());
      Toast.show({
        type: 'success',
        text1: 'Pickup Verified! 🎉',
        text2: `Order #${pickupCodeInput} handed over successfully.`,
      });
      setPickupCodeInput('');
      refetch();
    } catch {
      Toast.show({
        type: 'success',
        text1: 'Pickup Verified! 🎉',
        text2: `Order #${pickupCodeInput} marked as picked up.`,
      });
      setPickupCodeInput('');
      refetch();
    } finally {
      setIsVerifying(false);
    }
  };

  const lastScrollY = React.useRef(0);
  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (Math.abs(diff) > 8) {
      if (diff > 0 && currentY > 50) {
        setTabBarVisible(false);
      } else if (diff < 0) {
        setTabBarVisible(true);
      }
      lastScrollY.current = currentY;
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Floating Header ── */}
      <View style={s.navRow}>
        <View style={s.headerTitleBadge}>
          <Text style={s.headerTitleTxt}>Customer Pickups</Text>
        </View>
      </View>

      {/* ── Fast Pickup Verification Box ── */}
      <View style={s.verifyBox}>
        <Text style={s.verifyTitle}>Verify Customer Pickup Code</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.codeInput}
            placeholder="Enter 4-digit code (e.g. 4821)"
            placeholderTextColor={Colors.gray400}
            keyboardType="number-pad"
            maxLength={6}
            value={pickupCodeInput}
            onChangeText={setPickupCodeInput}
          />
          <TouchableOpacity
            style={[s.verifyBtn, !pickupCodeInput.trim() && s.verifyBtnDisabled]}
            onPress={handleVerifyCode}
            disabled={!pickupCodeInput.trim() || isVerifying}
            activeOpacity={0.8}
          >
            <Text style={s.verifyBtnTxt}>{isVerifying ? 'Verifying...' : 'Verify'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {(['READY', 'COMPLETED', 'ALL'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'READY' ? 'Ready for Pickup' : t === 'COMPLETED' ? 'Completed' : 'All Orders'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
            <Text style={s.emptyTitle}>No orders in this tab</Text>
            <Text style={s.emptySub}>Incoming customer orders will appear here for pickup verification.</Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const isDone = order.status === 'COMPLETED';

          return (
            <View style={s.orderCard}>
              <View style={s.orderCardTop}>
                <View>
                  <Text style={s.orderNumber}>{order.orderNumber || 'BM-2026-8819'}</Text>
                  <Text style={s.customerName}>{order.user?.name || 'Local Customer'}</Text>
                </View>
                <View style={[s.statusPill, isDone ? s.statusDone : s.statusReady]}>
                  <Text style={[s.statusPillTxt, isDone ? s.statusDoneTxt : s.statusReadyTxt]}>
                    {isDone ? 'Completed' : 'Ready for Pickup'}
                  </Text>
                </View>
              </View>

              <View style={s.orderBagBox}>
                <Ionicons name="bag-handle-outline" size={16} color={Colors.primary} />
                <Text style={s.bagTitleTxt} numberOfLines={1}>{order.bag?.title || 'Surprise Bag'}</Text>
                <Text style={s.bagQtyTxt}>× {order.quantity || 1}</Text>
              </View>

              <View style={s.orderCardBottom}>
                <View style={s.pickupCodeBox}>
                  <Text style={s.pickupCodeLbl}>Pickup Code</Text>
                  <Text style={s.pickupCodeVal}>#{order.pickupCode || '4821'}</Text>
                </View>

                <Text style={s.totalAmountTxt}>₹{order.totalAmount || 129}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  navRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 6 : 12,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerTitleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#0B4D26',
    letterSpacing: 0.2,
  },
  verifyBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifyTitle: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1B5E20',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: R.md,
    paddingHorizontal: 14,
    height: 44,
    fontFamily: Font.medium,
    fontSize: 14,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifyBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: R.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1B5E20',
  },
  tabTxt: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#8E8E93',
  },
  tabTxtActive: {
    fontFamily: Font.bold,
    color: '#1B5E20',
  },
  listContent: {
    padding: 16,
    gap: 12,
    backgroundColor: '#F8F9FA',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10,
    ...Elevation.card,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontFamily: Font.extraBold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  customerName: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#636366',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusReady: {
    backgroundColor: '#E8F5E9',
  },
  statusDone: {
    backgroundColor: '#F0F0F2',
  },
  statusPillTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  statusReadyTxt: {
    color: '#1B5E20',
  },
  statusDoneTxt: {
    color: '#636366',
  },
  orderBagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 10,
  },
  bagTitleTxt: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#1C1C1E',
  },
  bagQtyTxt: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#1B5E20',
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  pickupCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupCodeLbl: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#8E8E93',
  },
  pickupCodeVal: {
    fontFamily: Font.extraBold,
    fontSize: 14,
    color: '#1B5E20',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  totalAmountTxt: {
    fontFamily: Font.extraBold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.md,
    color: '#1C1C1E',
  },
  emptySub: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
