import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/theme';

const { width } = Dimensions.get('window');

export function HeroBanner() {
  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background decoration circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Save Food</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Save Money</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Save Planet</Text>
          </View>
        </View>

        <Text style={styles.headline}>Rescue today's{'\n'}Surprise Bags</Text>
        <Text style={styles.subtitle}>Fresh surplus food up to 70% off</Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => {/* scroll down */}}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Explore Surprise Bags</Text>
        </TouchableOpacity>
      </View>

      {/* Stat pills */}
      <View style={styles.stats}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>Rs 99</Text>
          <Text style={styles.statLabel}>Starting from</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statPill}>
          <Text style={styles.statValue}>70%</Text>
          <Text style={styles.statLabel}>Max discount</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statPill}>
          <Text style={styles.statValue}>5 km</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadow.lg,
  },
  circle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 20,
    right: 40,
  },
  content: {
    marginBottom: Spacing.base,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
  },
  headline: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.white,
    marginBottom: Spacing.sm,
    lineHeight: Typography.fontSize['2xl'] * 1.25,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.base,
  },
  cta: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignSelf: 'flex-start',
  },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statPill: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
