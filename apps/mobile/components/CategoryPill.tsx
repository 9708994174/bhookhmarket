import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface CategoryPillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, isSelected, onPress }: CategoryPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, isSelected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.white,
  },
});
