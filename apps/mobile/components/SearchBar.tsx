import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Font, Elevation } from '../constants/theme';

interface SearchBarProps {
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  value?: string;
  editable?: boolean;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
}

export function SearchBar({
  onPress,
  placeholder = 'Search bakeries, cafes, surprise bags...',
  value,
  editable = false,
  onChangeText,
  onFilterPress,
  hasActiveFilters = false,
}: SearchBarProps) {
  const content = (
    <View style={s.wrapper}>
      {/* Liquid Glass Capsule Background */}
      <View style={s.glassContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={s.androidGlassBg} />
        )}
        <View style={s.glassOverlay} />

        <View style={s.innerRow}>
          <Ionicons name="search" size={20} color="#1C1C1E" />
          {editable ? (
            <TextInput
              style={s.input}
              placeholder={placeholder}
              placeholderTextColor="#8E8E93"
              value={value}
              onChangeText={onChangeText}
            />
          ) : (
            <Text style={s.placeholderTxt} numberOfLines={1}>
              {value || placeholder}
            </Text>
          )}

          {onFilterPress && (
            <TouchableOpacity
              onPress={onFilterPress}
              style={[s.filterPill, hasActiveFilters && s.filterPillActive]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={hasActiveFilters ? '#FFFFFF' : '#1C1C1E'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress && !editable) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const s = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  glassContainer: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    overflow: 'hidden',
    position: 'relative',
    ...Elevation.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  androidGlassBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  innerRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
    color: '#1C1C1E',
    height: '100%',
  },
  placeholderTxt: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 13,
    color: '#8E8E93',
  },
  filterPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#1B5E20',
  },
});
