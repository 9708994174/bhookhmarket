import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Linking,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { orderService } from '../../../services';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING_PAYMENT:   { label: 'Payment Pending',  color: '#F59E0B', icon: 'time-outline' },
  CONFIRMED:         { label: 'Confirmed',        color: '#2E7D32', icon: 'checkmark-circle-outline' },
  READY_FOR_PICKUP:  { label: 'Ready for Pickup', color: '#1B5E20', icon: 'cube-outline' },
  PICKED_UP:         { label: 'Picked Up',        color: '#1565C0', icon: 'bag-check-outline' },
  COMPLETED:         { label: 'Completed',        color: '#2E7D32', icon: 'checkmark-done-circle-outline' },
  CANCELLED:         { label: 'Cancelled',        color: '#C62828', icon: 'close-circle-outline' },
  EXPIRED:           { label: 'Expired',          color: '#636366', icon: 'alert-circle-outline' },
};

export default function OrderDetailScreen() {
  const { id, confirmed } = useLocalSearchParams<{ id: string; confirmed?: string }>();
  const checkScale = useRef(new Animated.Value(0)).current;

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });
  const order = data?.data?.data ?? data?.data;

  useEffect(() => {
    if (confirmed === 'true') {
      Animated.spring(checkScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }
  }, [confirmed]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: Font.medium, color: Colors.textSecondary }}>Loading order...</Text>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.CONFIRMED;
  const isPickup   = order.orderStatus === 'READY_FOR_PICKUP';
  const isComplete = ['PICKED_UP', 'COMPLETED'].includes(order.orderStatus);
  const hasReview  = !!order.review;

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const openMaps = () => {
    const { latitude: lat, longitude: lng } = order.partner ?? {};
    if (!lat) return;
    const url =
      Platform.OS === 'ios'
        ? `maps://maps.apple.com/?daddr=${lat},${lng}`
        : `https://maps.google.com/maps?daddr=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── CONFIRMED ANIMATION ── */}
        {confirmed === 'true' && (
          <View style={s.confirmedSection}>
            <Animated.View style={[s.checkCircle, { transform: [{ scale: checkScale }] }]}>
              <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
            </Animated.View>
            <Text style={s.confirmedTitle}>Order Confirmed!</Text>
            <Text style={s.confirmedSub}>
              Your Surprise Bag from {order.partner?.businessName} is reserved.
            </Text>

            <View style={s.confirmedMeta}>
              <View style={s.confirmedMetaItem}>
                <Text style={s.confirmedMetaLabel}>Pickup by</Text>
                <Text style={s.confirmedMetaVal}>{fmt(order.bag?.pickupEnd)}</Text>
              </View>
              <View style={s.confirmedMetaDivider} />
              <View style={s.confirmedMetaItem}>
                <Text style={s.confirmedMetaLabel}>Amount Paid</Text>
                <Text style={s.confirmedMetaVal}>₹{order.totalAmount ?? order.total}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.viewOrdersBtn} onPress={() => router.push('/orders' as any)} activeOpacity={0.9}>
              <Text style={s.viewOrdersTxt}>View My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(consumer)/(tabs)')} activeOpacity={0.8}>
              <Text style={s.homeTxt}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STATUS BADGE ── */}
        <View style={s.statusCard}>
          <View style={[s.statusBadge, { backgroundColor: cfg.color + '14' }]}>
            <Ionicons name={cfg.icon} size={16} color={cfg.color} />
            <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={s.orderNum}>#{order.orderNumber?.slice(-8).toUpperCase() ?? order.id.slice(-6).toUpperCase()}</Text>
        </View>

        {/* Order info */}
        <View style={s.card}>
          <Text style={s.partnerName}>{order.partner?.businessName}</Text>
          <Text style={s.bagName}>{order.bag?.title}</Text>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Pickup Window</Text>
              <Text style={s.infoVal}>
                {fmt(order.bag?.pickupStart)} – {fmt(order.bag?.pickupEnd)}
              </Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Amount Paid</Text>
              <Text style={s.infoVal}>₹{order.totalAmount ?? order.total}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Payment Status</Text>
              <Text style={s.infoVal}>{order.paymentStatus}</Text>
            </View>
          </View>
        </View>

        {/* ── QR CODE (ready for pickup / completed) ── */}
        {(isPickup || isComplete) && order.pickupCode && (
          <View style={s.qrCard}>
            <Text style={s.qrTitle}>Show this at the store</Text>
            <Text style={s.qrSub}>Present the QR or 4-digit code to store staff.</Text>

            <View style={s.qrBox}>
              <QRCode
                value={`bhookhmarket://pickup/${order.pickupCode}`}
                size={180}
                color={Colors.dark}
                backgroundColor={Colors.white}
              />
            </View>

            {/* 4-digit display code */}
            <View style={s.codeRow}>
              {order.pickupCode.slice(0, 4).split('').map((ch: string, i: number) => (
                <View key={i} style={s.codeBox}>
                  <Text style={s.codeTxt}>{ch}</Text>
                </View>
              ))}
            </View>

            {isComplete && (
              <View style={s.collectedBadge}>
                <Ionicons name="checkmark-done" size={16} color="#2E7D32" />
                <Text style={s.collectedTxt}>Collected</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsSection}>
          {isPickup && (
            <TouchableOpacity style={s.primaryBtn} onPress={openMaps} activeOpacity={0.9}>
              <Ionicons name="navigate" size={18} color={Colors.white} />
              <Text style={s.primaryBtnTxt}>Get Directions</Text>
            </TouchableOpacity>
          )}
          {isComplete && !hasReview && (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => router.push(`/(consumer)/review/${order.id}`)}
              activeOpacity={0.9}
            >
              <Ionicons name="star" size={18} color={Colors.white} />
              <Text style={s.primaryBtnTxt}>Rate Your Experience</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.supportBtn} onPress={() => router.push('/(consumer)/help')} activeOpacity={0.8}>
            <Ionicons name="headset-outline" size={18} color={Colors.textSecondary} />
            <Text style={s.supportTxt}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Impact */}
        {isComplete && (
          <View style={s.impactCard}>
            <View style={s.impactIconCircle}>
              <Ionicons name="leaf" size={24} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.impactTitle}>Thanks for rescuing food!</Text>
              <Text style={s.impactDesc}>
                You saved ₹{(order.bag?.originalValue ?? 300) - (order.subtotal ?? 99)} and prevented food waste from going to landfills.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
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
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  confirmedSection: {
    backgroundColor: Colors.white,
    margin: Sp.base,
    borderRadius: R.xl,
    padding: Sp.xl,
    alignItems: 'center',
    gap: Sp.sm,
    ...Elevation.card,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.sm,
  },
  confirmedTitle: { fontFamily: Font.extraBold, fontSize: Sz['2xl'], color: Colors.textPrimary },
  confirmedSub: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  confirmedMeta: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: R.lg,
    padding: Sp.md,
    width: '100%',
    alignItems: 'center',
  },
  confirmedMetaItem: { flex: 1, alignItems: 'center' },
  confirmedMetaLabel: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textTertiary },
  confirmedMetaVal: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary, marginTop: 3 },
  confirmedMetaDivider: { width: 1, height: 32, backgroundColor: Colors.borderLight },
  viewOrdersBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: R.lg, paddingVertical: 14, alignItems: 'center' },
  viewOrdersTxt: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.white },
  homeBtn: { width: '100%', borderRadius: R.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  homeTxt: { fontFamily: Font.semiBold, fontSize: Sz.sm, color: Colors.textSecondary },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Sp.base,
    marginTop: Sp.sm,
    borderRadius: R.xl,
    padding: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 6 },
  statusTxt: { fontFamily: Font.bold, fontSize: Sz.xs },
  orderNum: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.textTertiary },
  card: {
    backgroundColor: Colors.white,
    margin: Sp.base,
    marginBottom: 0,
    borderRadius: R.xl,
    padding: Sp.base,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  partnerName: { fontFamily: Font.bold, fontSize: Sz.lg, color: Colors.textPrimary },
  bagName: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary },
  infoGrid: { gap: 8, marginTop: Sp.sm },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textTertiary },
  infoVal: { fontFamily: Font.semiBold, fontSize: Sz.xs, color: Colors.textPrimary },
  qrCard: {
    backgroundColor: Colors.white,
    margin: Sp.base,
    marginBottom: 0,
    borderRadius: R.xl,
    padding: Sp.base,
    alignItems: 'center',
    gap: Sp.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  qrTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  qrSub: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textSecondary, textAlign: 'center' },
  qrBox: { padding: Sp.base, borderRadius: R.xl, borderWidth: 1.5, borderColor: Colors.borderLight },
  codeRow: { flexDirection: 'row', gap: Sp.sm },
  codeBox: {
    width: 52,
    height: 60,
    borderRadius: R.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTxt: { fontFamily: Font.extraBold, fontSize: Sz['2xl'], color: Colors.textPrimary },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySurface,
    borderRadius: R.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  collectedTxt: { fontFamily: Font.bold, fontSize: Sz.xs, color: '#2E7D32' },
  actionsSection: { margin: Sp.base, marginBottom: 0, gap: Sp.sm },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnTxt: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.white },
  supportBtn: {
    borderRadius: R.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  supportTxt: { fontFamily: Font.semiBold, fontSize: Sz.sm, color: Colors.textSecondary },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.md,
    margin: Sp.base,
    backgroundColor: Colors.primarySurface,
    borderRadius: R.xl,
    padding: Sp.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  impactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactTitle: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.primary, marginBottom: 2 },
  impactDesc: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.textSecondary, lineHeight: 18 },
});
