import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R } from '../../constants/theme';
import { authService, partnerService } from '../../services';
import { useAuthStore } from '../../store';

export default function PartnerOtpScreen() {
  const { phone, devOtp, fullName, businessName, email, category } =
    useLocalSearchParams<{
      phone: string;
      devOtp?: string;
      fullName: string;
      businessName: string;
      email?: string;
      category: string;
    }>();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const onChange = (txt: string, i: number) => {
    const d = [...digits];
    d[i] = txt.replace(/\D/g, '');
    setDigits(d);
    if (txt && i < 5) inputs.current[i + 1]?.focus();
    if (!txt && i > 0) inputs.current[i - 1]?.focus();
  };

  const onKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const verify = async () => {
    const otp = digits.join('');
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone!, otp);
      const { accessToken, refreshToken } = res.data.data;
      await setTokens(accessToken, refreshToken);

      // Complete Partner Profile registration
      await partnerService.register({
        businessName: businessName!,
        category: (category as any) || 'BAKERY',
        phone: phone!,
        email: email || undefined,
        address: 'Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        latitude: 19.076,
        longitude: 72.8777,
      });

      const me = await authService.getMe();
      setUser(me.data.data);

      Toast.show({
        type: 'success',
        text1: 'Welcome Partner!',
        text2: 'Your partner dashboard is ready.',
      });
      router.replace('/(partner)/dashboard');
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: e?.response?.data?.error ?? 'Invalid OTP code.',
      });
    } finally {
      setLoading(false);
    }
  };

  const complete = digits.every((d) => d !== '');

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.content}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
          </TouchableOpacity>

          <Text style={s.heading}>Verify your phone</Text>
          <Text style={s.sub}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={s.phone}>+91 {phone}</Text>
          </Text>

          {devOtp ? (
            <View style={s.devHint}>
              <Ionicons name="bug-outline" size={15} color={Colors.primary} />
              <Text style={s.devTxt}>Development OTP: {devOtp}</Text>
            </View>
          ) : null}

          {/* OTP boxes */}
          <View style={s.boxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r!;
                }}
                style={[s.box, d ? s.boxFilled : null]}
                value={d}
                onChangeText={(t) => onChange(t, i)}
                onKeyPress={(e) => onKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Dev Hint */}
          {/* Verify CTA */}
          <TouchableOpacity
            style={[s.verifyBtn, (!complete || loading) && s.verifyOff]}
            onPress={verify}
            disabled={!complete || loading}
            activeOpacity={0.9}
          >
            <Text style={s.verifyTxt}>
              {loading ? 'Setting up account...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Resend code in </Text>
            {canResend ? (
              <TouchableOpacity onPress={() => authService.sendOtp(phone!)}>
                <Text style={s.resendLink}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.resendTimer}>0:{String(timer).padStart(2, '0')}</Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BOX = 48;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, paddingHorizontal: Sp.xl, paddingTop: Sp.base },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: Sp.lg },
  heading: {
    fontFamily: Font.extraBold,
    fontSize: Sz['2xl'],
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Sp.xl,
  },
  phone: { fontFamily: Font.bold, color: Colors.textPrimary },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: Sp.lg },
  box: {
    flex: 1,
    height: 56,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontFamily: Font.bold,
    fontSize: Sz.xl,
    color: Colors.textPrimary,
  },
  boxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primarySurface,
    borderRadius: R.md,
    padding: Sp.sm,
    marginBottom: Sp.base,
  },
  devTxt: { fontFamily: Font.medium, fontSize: Sz.xs, color: Colors.primary },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Sp.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyOff: { backgroundColor: Colors.gray300, shadowOpacity: 0, elevation: 0 },
  verifyTxt: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.white },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary },
  resendTimer: { fontFamily: Font.semiBold, fontSize: Sz.sm, color: Colors.gray500 },
  resendLink: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.primary },
});
