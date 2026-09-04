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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R } from '../../constants/theme';
import { authService } from '../../services';
import { useAuthStore } from '../../store';

const RESEND_SECS = 30;

export default function OtpScreen() {
  const { phone, targetRole } = useLocalSearchParams<{ phone: string; targetRole?: string }>();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(RESEND_SECS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputs = useRef<TextInput[]>([]);
  const { setTokens, setUser, setNewUser } = useAuthStore();

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onChange = (val: string, idx: number) => {
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const resend = async () => {
    if (!canResend) return;
    try {
      await authService.sendOtp(phone);
      setCountdown(RESEND_SECS);
      setCanResend(false);
      Toast.show({ type: 'success', text1: 'OTP Resent', text2: 'A new code has been sent.' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not resend OTP.' });
    }
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone, code);
      const { accessToken, refreshToken, isNewUser } = res.data.data;
      await setTokens(accessToken, refreshToken);
      setNewUser(isNewUser);

      if (isNewUser) {
        router.replace('/(auth)/location' as any);
      } else {
        const me = await authService.getMe();
        const userData = me.data.data;
        setUser(userData);
        
        // Strict role routing: honor the flow where login was initiated
        if (targetRole === 'CONSUMER') {
          router.replace('/(consumer)/(tabs)');
        } else if (targetRole === 'PARTNER' || userData?.role === 'PARTNER') {
          router.replace('/(partner)/(tabs)' as any);
        } else {
          router.replace('/(consumer)/(tabs)');
        }
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: e?.response?.data?.error ?? 'Invalid OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const complete = digits.every((d) => d !== '');

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Top Floating Glassmorphic Header */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.backPill}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#0B4D26" />
          </TouchableOpacity>
          <View style={s.headerTitleBadge}>
            <Text style={s.headerTitleTxt}>OTP Verification</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.content}>
            {/* Heading */}
            <Text style={s.heading}>Verify your number</Text>
            <Text style={s.sub}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={s.phone}>+91 {phone}</Text>
            </Text>

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

            {/* Verify CTA */}
            <TouchableOpacity
              style={[s.verifyBtn, (!complete || loading) && s.verifyOff]}
              onPress={verify}
              disabled={!complete || loading}
              activeOpacity={0.9}
            >
              <Text style={s.verifyTxt}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
            </TouchableOpacity>

            {/* Resend */}
            <View style={s.resendRow}>
              <Text style={s.resendLabel}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={resend} disabled={!canResend}>
                <Text style={[s.resendLink, !canResend && s.resendLinkOff]}>
                  {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAF7' },
  safe: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    paddingBottom: 8,
    zIndex: 10,
  },
  backPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleTxt: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#0B4D26',
    letterSpacing: 0.2,
  },
  content: { flex: 1, paddingHorizontal: Sp.xl, paddingTop: Sp.lg },
  heading: { fontFamily: Font.extraBold, fontSize: Sz['2xl'], color: Colors.textPrimary, marginBottom: Sp.xs },
  sub: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Sp['2xl'] },
  phone: { fontFamily: Font.bold, color: Colors.textPrimary },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: Sp.xl },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: R.md,
    textAlign: 'center',
    fontFamily: Font.bold,
    fontSize: Sz.xl,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  boxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyOff: { backgroundColor: Colors.gray300, shadowOpacity: 0, elevation: 0 },
  verifyTxt: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.white },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Sp.xl },
  resendLabel: { fontFamily: Font.regular, fontSize: Sz.sm, color: Colors.textSecondary },
  resendLink: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.primary },
  resendLinkOff: { color: Colors.gray400 },
});
