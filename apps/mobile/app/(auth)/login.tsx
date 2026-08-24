import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../constants/theme';
import { authService } from '../../services';
import { useAuthStore } from '../../store';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// ── Official Multi-Color Google G Icon ─────────────────────────────────────
function GoogleColorIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { setTokens } = useAuthStore();

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '734086635945-saltkn02ankpjkiabled4b3dh7p7vsq8.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '734086635945-saltkn02ankpjkiabled4b3dh7p7vsq8.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '734086635945-saltkn02ankpjkiabled4b3dh7p7vsq8.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication, params } = googleResponse;
      const idToken = authentication?.idToken || (params as any)?.id_token;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const res = await authService.googleAuth(idToken);
      const { accessToken, refreshToken, isNewUser } = res.data.data;
      await setTokens(accessToken, refreshToken);
      Toast.show({
        type: 'success',
        text1: 'Signed in with Google',
        text2: 'Welcome to BhookhMarket!',
      });
      if (isNewUser) {
        router.replace('/(auth)/location' as any);
      } else {
        router.replace('/(consumer)/(tabs)');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In failed',
        text2: err?.response?.data?.error ?? 'Could not authenticate with Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const valid = /^[6-9]\d{9}$/.test(phone);

  const handleContinue = async () => {
    if (!valid) {
      Toast.show({
        type: 'error',
        text1: 'Invalid mobile number',
        text2: 'Please enter a valid 10-digit Indian phone number.',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.sendOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone, devOtp: response.data.devOtp } });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP',
        text2: e?.response?.data?.error ?? 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ImageBackground
        source={require('../../assets/login_bg.jpg')}
        style={s.bgImage}
        resizeMode="cover"
      >
        <SafeAreaView style={s.safe} edges={['top']}>
          {/* Top Title Bar */}
          <View style={s.navRow}>
            <View style={s.headerTitleBadge}>
              <Text style={s.headerTitleTxt}>Sign In</Text>
            </View>
          </View>

          {/* Scrollable Layout with Keyboard Auto-Scroll */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={s.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* ── 1. Top Value Pillars Fixed Card ── */}
              <View style={s.topHeroSection}>
                <View style={s.pillarsCard}>
                  <View style={s.pillarItem}>
                    <View style={s.pillarIconCircle}>
                      <MaterialCommunityIcons name="bowl-mix-outline" size={18} color="#0B4D26" />
                    </View>
                    <Text style={s.pillarLabel}>Quality surplus{'\n'}food</Text>
                  </View>

                  <View style={s.pillarDivider} />

                  <View style={s.pillarItem}>
                    <View style={s.pillarIconCircle}>
                      <Feather name="feather" size={17} color="#0B4D26" />
                    </View>
                    <Text style={s.pillarLabel}>Reduce food{'\n'}waste</Text>
                  </View>

                  <View style={s.pillarDivider} />

                  <View style={s.pillarItem}>
                    <View style={s.pillarIconCircle}>
                      <Ionicons name="heart-outline" size={18} color="#0B4D26" />
                    </View>
                    <Text style={s.pillarLabel}>Build a better{'\n'}community</Text>
                  </View>
                </View>
              </View>

              {/* ── 2. White Curved Card Sheet ── */}
              <View style={s.bottomSheet}>
                {/* Brand Logo & Theme Header */}
                <View style={s.sheetBrandHeader}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={s.sheetLogo}
                    resizeMode="contain"
                  />
                  <View style={s.kickerRow}>
                    <View style={s.kickerLine} />
                    <Ionicons name="leaf" size={12} color="#2E7D32" style={s.kickerLeaf} />
                    <View style={s.kickerLine} />
                  </View>
                  <Text style={s.kickerTxt}>RESCUE MORE. WASTE LESS.</Text>
                </View>

                {/* Mobile Phone Number Input Pill */}
                <View style={[s.inputPill, isFocused && s.inputPillFocused]}>
                  <TouchableOpacity style={s.prefixBtn} activeOpacity={0.8}>
                    <Text style={s.prefixTxt}>+91</Text>
                    <Ionicons name="chevron-down" size={14} color="#636366" />
                  </TouchableOpacity>
                  <View style={s.inputDivider} />
                  <TextInput
                    style={s.phoneInput}
                    placeholder="Enter Mobile Number"
                    placeholderTextColor="#8E8E93"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>

                {/* Continue with Mobile Action Button */}
                <TouchableOpacity
                  style={[
                    s.continueBtn,
                    (!valid || loading) && s.continueBtnDisabled,
                    loading && s.continueBtnLoading,
                  ]}
                  onPress={handleContinue}
                  disabled={!valid || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <View style={{ width: 34 }} />
                      <Text style={s.continueTxt}>Continue with Mobile</Text>
                      <View style={s.arrowCircle}>
                        <Ionicons name="arrow-forward" size={18} color="#0B4D26" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                <View style={s.orRow}>
                  <View style={s.orLine} />
                  <Text style={s.orTxt}>OR</Text>
                  <View style={s.orLine} />
                </View>

                {/* Continue with Google */}
                <TouchableOpacity
                  style={s.googleBtn}
                  onPress={() => promptGoogleAsync()}
                  disabled={googleLoading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <>
                      <View style={s.googleIconBox}>
                        <GoogleColorIcon size={20} />
                      </View>
                      <Text style={s.googleTxt}>Continue with Google</Text>
                      <View style={{ width: 28 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Partner with us Banner Card */}
                <TouchableOpacity
                  style={s.partnerCard}
                  onPress={() => router.push('/(auth)/partner-onboarding')}
                  activeOpacity={0.85}
                >
                  <View style={s.storeIconBox}>
                    <Ionicons name="storefront" size={20} color="#0B4D26" />
                  </View>
                  <View style={s.partnerInfo}>
                    <Text style={s.partnerTitle}>Are you a restaurant or store?</Text>
                    <Text style={s.partnerAction}>Partner with us</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#0B4D26" />
                </TouchableOpacity>

                {/* Legal Terms Footer */}
                <Text style={s.terms}>
                  By continuing, you agree to our{' '}
                  <Text style={s.termsLink}>Terms of Service</Text> &{' '}
                  <Text style={s.termsLink}>Privacy Policy</Text>.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAF7',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safe: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    zIndex: 10,
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topHeroSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 140 : 155,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  pillarsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 8,
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#0B4D26',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  pillarLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#0B4D26',
    textAlign: 'center',
    lineHeight: 14,
  },
  pillarDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(11, 77, 38, 0.2)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetBrandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetLogo: {
    width: Math.min(width * 0.72, 260),
    height: 56,
    marginBottom: 6,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  kickerLine: {
    width: 28,
    height: 1,
    backgroundColor: '#C8E6C9',
  },
  kickerLeaf: {
    transform: [{ rotate: '45deg' }],
  },
  kickerTxt: {
    fontFamily: Font.extraBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: '#0B4D26',
    textAlign: 'center',
  },
  googleIconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: Font.extraBold,
    fontSize: 21,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  inputPillFocused: {
    borderColor: '#0B4D26',
  },
  prefixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  prefixTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E5E5EA',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: '#1C1C1E',
    height: '100%',
    letterSpacing: 0.5,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B4D26',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  continueBtnDisabled: {
    backgroundColor: '#8FA899',
  },
  continueBtnLoading: {
    justifyContent: 'center',
  },
  continueTxt: {
    fontFamily: Font.bold,
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  orTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#8E8E93',
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
    gap: 10,
    marginBottom: 14,
  },
  googleTxt: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: '#1C1C1E',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F7F2',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeIconImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#3C3C43',
  },
  partnerAction: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#0B4D26',
    marginTop: 1,
  },
  terms: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    fontFamily: Font.bold,
    color: '#0B4D26',
  },
});
