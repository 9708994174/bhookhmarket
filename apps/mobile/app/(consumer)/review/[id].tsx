import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { reviewService } from '../../../services';
import Toast from 'react-native-toast-message';

const RATING_TAGS = [
  'Food Quality',
  'Quantity',
  'Value for Money',
  'Staff Behavior',
  'Packaging',
  'Freshness',
];

export default function ReviewScreen() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Food Quality', 'Value for Money']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!orderId) return;
    setSubmitting(true);
    try {
      await reviewService.create({
        orderId,
        rating,
        tags: selectedTags,
        comment,
      });
      Toast.show({
        type: 'success',
        text1: 'Review Submitted!',
        text2: 'Thank you for helping other food rescuers.',
      });
      router.back();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission failed',
        text2: e?.response?.data?.error ?? 'Could not submit review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Rating Header */}
        <View style={s.ratingCard}>
          <Text style={s.mainPrompt}>How was your Surprise Bag?</Text>
          <Text style={s.subPrompt}>
            Your review helps local merchants and other food rescuers.
          </Text>

          {/* 5 Stars */}
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={s.starBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={38}
                  color={rating >= star ? '#FFB300' : Colors.gray300}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What did you like the most?</Text>
          <View style={s.tagsGrid}>
            {RATING_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[s.tagChip, isSelected && s.tagChipSelected]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tagTxt, isSelected && s.tagTxtSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comments Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Write a review (optional)</Text>
          <TextInput
            style={s.textArea}
            placeholder="Great food, very fresh and friendly pickup experience!"
            placeholderTextColor={Colors.gray400}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={s.bottomCta}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && s.submitBtnOff]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={s.submitTxt}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  content: { padding: Sp.base, gap: Sp.xl },
  ratingCard: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  mainPrompt: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subPrompt: {
    fontFamily: Font.regular,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Sp.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  starBtn: { padding: 4 },
  section: { gap: Sp.sm },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: Sp.md,
    paddingVertical: 8,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tagChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  tagTxt: {
    fontFamily: Font.medium,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
  },
  tagTxtSelected: {
    color: Colors.primary,
    fontFamily: Font.bold,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: R.lg,
    padding: Sp.md,
    fontFamily: Font.regular,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    minHeight: 100,
    backgroundColor: Colors.white,
  },
  bottomCta: {
    paddingHorizontal: Sp.base,
    paddingBottom: Sp.base,
    paddingTop: Sp.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnOff: { backgroundColor: Colors.gray300, shadowOpacity: 0, elevation: 0 },
  submitTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.white,
  },
});
