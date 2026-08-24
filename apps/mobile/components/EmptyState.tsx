import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: string;
}

export function EmptyState({ title, description, ctaLabel, onCta, icon = 'E' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onCta && (
        <TouchableOpacity style={styles.cta} onPress={onCta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  icon: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 32,
    color: Colors.textTertiary,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.6,
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.base,
    color: Colors.white,
  },
  loadingContainer: {
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  skeleton: {
    height: 140,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.gray100,
  },
});
