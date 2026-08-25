import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Font, Sz, Sp, R, Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Save good food',
    desc: 'Help reduce food waste\nby giving unsold delicious food\na second life.',
    image: require('../../assets/onboarding1.jpg'),
  },
  {
    id: '2',
    title: 'Save money',
    desc: 'Get surprise bags of\nyour favorite food at\nunbeatable discounted prices.',
    image: require('../../assets/onboarding2.jpg'),
  },
  {
    id: '3',
    title: 'Help the planet',
    desc: 'Small everyday actions together\ncreate a huge positive impact\nfor our environment.',
    image: require('../../assets/onboarding3.jpg'),
  },
];

export default function OnboardingScreen() {
  const [idx, setIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const goNext = () => {
    if (idx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: idx + 1, animated: true });
      setIdx(idx + 1);
    } else {
      router.push('/(auth)/location');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header / Skip Button */}
      <View style={s.topRow}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/location')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={s.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Slider */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={s.slideContainer}>
            {/* Center Circular Frame Illustration */}
            <View style={s.imageWrapper}>
              <Image source={item.image} style={s.slideImage} resizeMode="cover" />
            </View>

            {/* Structured Text Area with Increased Size */}
            <View style={s.textArea}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc}>{item.desc}</Text>
            </View>
          </View>
        )}
      />

      {/* Dot Indicators */}
      <View style={s.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === idx ? s.dotActive : null,
            ]}
          />
        ))}
      </View>

      {/* Bottom CTA Button */}
      <View style={s.ctaArea}>
        <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.9}>
          <Text style={s.nextTxt}>
            {idx < SLIDES.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure uniform white background
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  skip: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: '#8E8E93',
  },
  slideContainer: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  imageWrapper: {
    width: width * 0.76,
    height: width * 0.76,
    borderRadius: (width * 0.76) / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  textArea: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontFamily: Font.extraBold,
    fontSize: 28,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  desc: {
    fontFamily: Font.medium,
    fontSize: 16.5,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 25,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E5E5EA',
  },
  dotActive: {
    backgroundColor: '#1B5E20',
    width: 24,
    borderRadius: 4,
  },
  ctaArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  nextTxt: {
    fontFamily: Font.bold,
    fontSize: 16.5,
    color: '#FFFFFF',
  },
});
