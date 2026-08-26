import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1300),
    ]).start(() => {
      if (!isLoading) {
        router.replace(isAuthenticated ? '/(consumer)/(tabs)' : '/(auth)/onboarding');
      }
    });
  }, [isLoading]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Official Animated Brand Icon & Title */}
      <Animated.View
        style={[
          s.contentWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={s.appIcon}
          resizeMode="contain"
        />
        <Animated.Text style={s.brandTitle}>BhookhMarket</Animated.Text>
        <Animated.Text style={s.brandTagline}>RESCUE MORE. WASTE LESS.</Animated.Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 140,
    height: 140,
    borderRadius: 28,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0B4D26',
    marginTop: 18,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 6,
    letterSpacing: 1.8,
  },
});
