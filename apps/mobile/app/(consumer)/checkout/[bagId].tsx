import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { orderService, paymentService } from '../../../services';
import Toast from 'react-native-toast-message';

const PAYMENT_METHODS = [
  { id: 'upi', icon: 'phone-portrait-outline', label: 'UPI', sub: 'Google Pay · PhonePe · Paytm · BHIM' },
  { id: 'card', icon: 'card-outline', label: 'Credit / Debit Card', sub: 'Visa · Mastercard · RuPay' },
  { id: 'netbanking', icon: 'business-outline', label: 'Net Banking', sub: 'All major Indian banks' },
  { id: 'wallet', icon: 'wallet-outline', label: 'Wallets', sub: 'Paytm · Amazon Pay' },
];

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [method, setMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [upiId, setUpiId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getById(orderId!),
    enabled: !!orderId,
  });

  const order = data?.data?.data ?? data?.data;

  const bagPrice = useMemo(
    () => Number(order?.bagPrice ?? order?.bag?.sellingPrice ?? 0),
    [order]
  );
  const quantity = Number(order?.quantity ?? 1);
  const platformFee = Number(order?.platformFee ?? 5);
  const totalAmount = Number(order?.totalAmount ?? bagPrice * quantity + platformFee);

  const pay = async () => {
    if (!order) return;

    if (method === 'upi' && !upiId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'UPI ID required',
        text2: 'Enter a valid UPI ID to continue.',
      });
      return;
    }

    setPaying(true);

    try {
      const RazorpayCheckout = require('react-native-razorpay').default;
      const res = await paymentService.createOrder(order.id);
      const paymentData = res?.data?.data ?? res?.data ?? {};
      const isLivePaymentReady =
        paymentData.razorpayOrderId &&
        paymentData.keyId;

      if (!isLivePaymentReady) {
        throw new Error(
          'Live UPI payments are not configured yet. Add Razorpay credentials on the backend to enable secure payment processing.'
        );
      }

      const payment = await RazorpayCheckout.open({
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency ?? 'INR',
        name: 'BhookhMarket',
        description: order.bag?.title ?? 'Surprise bag reservation',
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: order.user?.name,
          contact: order.user?.phone,
          email: order.user?.email,
        },
        notes: { orderId: order.id, paymentMethod: method, upiId: upiId.trim() },
        ...(method === 'upi' ? { method: { netbanking: false, card: false, wallet: false } } : {}),
        theme: { color: Colors.primary },
      });

      await paymentService.verify({
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
        orderId: order.id,
      });

      Toast.show({
        type: 'success',
        text1: 'Payment successful',
        text2: 'Your surprise bag is reserved.',
      });

      router.replace(`/(consumer)/orders/${order.id}?confirmed=true` as any);
    } catch (e: any) {
      if (e?.code === 2 || e?.description === 'Payment cancelled') {
        Toast.show({ type: 'info', text1: 'Payment cancelled', text2: 'Your order is still awaiting payment.' });
        return;
      }
      const errorMessage =
        e?.response?.data?.error ??
        e?.message ??
        'Live UPI checkout is unavailable until the Razorpay keys are configured on the server.';
      Toast.show({ type: 'error', text1: 'Payment setup error', text2: errorMessage });
    } finally {
      setPaying(false);
    }
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: Font.medium, color: Colors.textSecondary }}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const pickupStart = order?.bag?.pickupStart ?? new Date().toISOString();
  const pickupEnd = order?.bag?.pickupEnd ?? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  const pickupDate = new Date(pickupStart).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const originalValue = Number(order?.bag?.originalValue ?? bagPrice * 2.3);
  const totalSavings = Math.max(originalValue * quantity - totalAmount, 0);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.summaryBanner}>
          <View>
            <Text style={s.summaryTitle}>Ready to reserve</Text>
            <Text style={s.summarySubtitle}>Pay securely and collect within the pickup window.</Text>
          </View>
          <View style={s.summaryPill}>
            <Text style={s.summaryPillText}>₹{Number(totalAmount).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Bag details</Text>
          <Text style={s.restaurant}>{order.partner?.businessName ?? 'Partner store'}</Text>
          <Text style={s.bagName}>{order.bag?.title ?? 'Surprise bag'}</Text>
          <View style={s.qtyBadge}>
            <Text style={s.qtyTxt}>Qty: {quantity} bag{quantity > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Pickup details</Text>
          <View style={s.pickupRow}>
            <View style={s.pickupIconBox}>
              <Ionicons name="location" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pickupAddress}>{order.partner?.businessName ?? 'Pickup location'}</Text>
              <Text style={s.pickupDate}>{pickupDate}</Text>
              <Text style={s.pickupTime}>
                Window: {fmt(pickupStart)} – {fmt(pickupEnd)}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Payment summary</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Bag total ({quantity}x)</Text>
            <Text style={s.rowVal}>₹{(bagPrice * quantity).toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Platform fee</Text>
            <Text style={s.rowVal}>₹{platformFee.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>You save</Text>
            <Text style={s.rowValPositive}>₹{totalSavings.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total payable</Text>
            <Text style={s.totalVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Payment method</Text>
          {PAYMENT_METHODS.map((m) => {
            const active = method === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.methodRow, active && s.methodActive]}
                onPress={() => setMethod(m.id)}
                activeOpacity={0.8}
              >
                <View style={[s.methodIconBox, active && s.methodIconBoxActive]}>
                  <Ionicons name={m.icon as any} size={20} color={active ? Colors.primary : Colors.gray600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodName}>{m.label}</Text>
                  <Text style={s.methodSub}>{m.sub}</Text>
                </View>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {method === 'upi' && (
            <View style={s.upiInputWrap}>
              <Text style={s.upiLabel}>UPI ID</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="youremail@upi"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={s.upiInput}
              />
            </View>
          )}
        </View>

        <View style={s.guarantee}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          <Text style={s.guaranteeTxt}>100% secure payments · instant confirmation</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        <View>
          <Text style={s.ctaTotal}>Total</Text>
          <Text style={s.ctaAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={[s.payBtn, paying && s.payBtnOff]}
          onPress={pay}
          disabled={paying}
          activeOpacity={0.9}
        >
          <Text style={s.payTxt}>{paying ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  scroll: { padding: Sp.base, gap: Sp.base },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    borderRadius: R.xl,
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  summaryTitle: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.primary },
  summarySubtitle: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.textSecondary, marginTop: 2 },
  summaryPill: {
    backgroundColor: Colors.white,
    borderRadius: R.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Elevation.xs,
  },
  summaryPillText: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
    ...Elevation.card,
  },
  cardTitle: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary, marginBottom: 4 },
  restaurant: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  bagName: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary },
  qtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.xs,
    marginTop: 4,
  },
  qtyTxt: { fontFamily: Font.bold, fontSize: 10, color: Colors.primary },
  pickupRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pickupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupAddress: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary },
  pickupDate: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.textSecondary, marginTop: 2 },
  pickupTime: { fontFamily: Font.regular, fontSize: Sz.xs, color: Colors.primary, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary },
  rowVal: { fontFamily: Font.medium, fontSize: Sz.sm, color: Colors.textPrimary },
  rowValPositive: { fontFamily: Font.medium, fontSize: Sz.sm, color: Colors.success },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  totalLabel: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  totalVal: { fontFamily: Font.extraBold, fontSize: Sz.lg, color: Colors.primary },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primaryLight },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconBoxActive: { backgroundColor: Colors.white },
  methodName: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary },
  methodSub: { fontFamily: Font.regular, fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  guaranteeTxt: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.success },
  upiInputWrap: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  upiLabel: { fontFamily: Font.bold, fontSize: Sz.xs, color: Colors.textSecondary, marginBottom: 8 },
  upiInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: R.md,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: Font.medium,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Sp.base,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTotal: { fontFamily: Font.regular, fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase' },
  ctaAmount: { fontFamily: Font.extraBold, fontSize: Sz.xl, color: Colors.textPrimary },
  payBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingHorizontal: 26,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnOff: { opacity: 0.6 },
  payTxt: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.white },
});
