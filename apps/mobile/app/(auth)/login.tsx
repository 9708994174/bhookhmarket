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

function GoogleColorIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { setTokens, setUser } = useAuthStore();

  const [_req, googleRes, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-client-id.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios-client-id.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web-client-id.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleRes?.type === 'success') {
      const { authentication } = googleRes;
      if (authentication?.idToken || authentication?.accessToken) {
        handleGoogleSignIn(authentication.idToken || authentication.accessToken);
      }
    }
  }, [googleRes]);

  const handleGoogleSignIn = async (token: string) => {
    setGoogleLoading(true);
    try {
      const res = await authService.googleAuth(token);
      const { accessToken, refreshToken, user } = res.data.data;
      await setTokens(accessToken, refreshToken);
      setUser(user);
      Toast.show({
        type: 'success',
        text1: `Welcome ${user.name ?? ''}!`,
        text2: 'Signed in successfully.',
      });
      router.replace((user.role === 'PARTNER' ? '/(partner)/dashboard' : '/(consumer)/discover') as any);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Google Sign In failed',
        text2: e?.response?.data?.error ?? 'Please try again with phone number.',
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
        text2: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone, targetRole: 'CONSUMER' } });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not send OTP',
        text2: e?.response?.data?.error ?? 'Please try again.',
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
                  <Image
                    source={require('../../assets/store_badge.jpg')}
                    style={s.storeHouseImg}
                    resizeMode="cover"
                  />
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
    fontSize: 11,
    color: '#0B4D26',
    letterSpacing: 1.8,
    marginTop: 2,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    marginBottom: 14,
  },
  inputPillFocused: {
    borderColor: '#0B4D26',
    backgroundColor: '#FFFFFF',
  },
  prefixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  prefixTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D1D6',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: '#1C1C1E',
    height: '100%',
  },
  continueBtn: {
    backgroundColor: '#0B4D26',
    borderRadius: 26,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 9,
    shadowColor: '#0B4D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnLoading: {
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  continueBtnDisabled: {
    backgroundColor: '#A8C5B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
    marginVertical: 14,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  orTxt: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: '#8E8E93',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 14,
  },
  googleIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleTxt: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 77, 38, 0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 77, 38, 0.12)',
    marginBottom: 16,
  },
  storeHouseImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#3A3A3C',
  },
  partnerAction: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#0B4D26',
    marginTop: 1,
  },
  terms: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    fontFamily: Font.semiBold,
    color: '#0B4D26',
  },
});
