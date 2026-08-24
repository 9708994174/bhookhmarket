import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { bagService } from '../../../services';

const CATEGORIES = ['BAKERY', 'CAFE', 'RESTAURANT', 'HOTEL', 'SUPERMARKET', 'CATERER'];

export default function AddNewBagScreen() {
  const [title, setTitle] = useState('Surprise Bag');
  const [category, setCategory] = useState('BAKERY');
  const [originalValue, setOriginalValue] = useState('300');
  const [sellingPrice, setSellingPrice] = useState('99');
  const [pickupStart, setPickupStart] = useState('20:00');
  const [pickupEnd, setPickupEnd] = useState('21:00');
  const [quantity, setQuantity] = useState('5');
  const [loading, setLoading] = useState(false);

  const origNum = parseFloat(originalValue) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const discountPercent =
    origNum > sellNum && origNum > 0
      ? Math.round(((origNum - sellNum) / origNum) * 100)
      : 0;

  const handlePublish = async () => {
    if (!title || origNum <= 0 || sellNum <= 0 || sellNum >= origNum) {
      Toast.show({
        type: 'error',
        text1: 'Invalid details',
        text2: 'Selling price must be lower than original value.',
      });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const [sH, sM] = pickupStart.split(':').map(Number);
      const [eH, eM] = pickupEnd.split(':').map(Number);

      const pStart = new Date(now);
      pStart.setHours(sH || 20, sM || 0, 0, 0);

      const pEnd = new Date(now);
      pEnd.setHours(eH || 21, eM || 0, 0, 0);

      await bagService.create({
        title,
        category: category as any,
        originalValue: origNum,
        sellingPrice: sellNum,
        quantity: parseInt(quantity, 10) || 1,
        pickupStart: pStart.toISOString(),
        pickupEnd: pEnd.toISOString(),
        isVegetarian: true,
        foodSafetyDeclared: true,
      });

      Toast.show({
        type: 'success',
        text1: 'Surprise Bag Published!',
        text2: 'Nearby food rescuers can now see and buy it.',
      });
      router.back();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to publish',
        text2: e?.response?.data?.error ?? 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add New Bag</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Discount Banner Preview */}
          {discountPercent > 0 && (
            <View style={s.discountPreview}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={s.discountPreviewTxt}>
                Customer Savings: {discountPercent}% OFF (Save ₹{origNum - sellNum} per bag)
              </Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={s.form}>
            {/* Bag Title */}
            <View style={s.field}>
              <Text style={s.label}>Bag Title</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Fresh Surprise Bag"
                placeholderTextColor={Colors.gray400}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Food Category */}
            <View style={s.field}>
              <Text style={s.label}>Food Category</Text>
              <View style={s.catRow}>
                {CATEGORIES.map((c) => {
                  const isSel = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[s.catPill, isSel && s.catPillActive]}
                      onPress={() => setCategory(c)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.catTxt, isSel && s.catTxtActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Price Inputs */}
            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Original Value (₹)</Text>
                <TextInput
                  style={s.input}
                  placeholder="300"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="numeric"
                  value={originalValue}
                  onChangeText={setOriginalValue}
                />
              </View>

              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Selling Price (₹)</Text>
                <TextInput
                  style={[s.input, s.sellingPriceInput]}
                  placeholder="99"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                />
              </View>
            </View>

            {/* Pickup Time Window */}
            <View style={s.field}>
              <Text style={s.label}>Pickup Time Window (Today)</Text>
              <View style={s.row}>
                <View style={[s.timeBox, { flex: 1 }]}>
                  <Text style={s.timeLabel}>Start (24h)</Text>
                  <TextInput
                    style={s.timeInput}
                    placeholder="20:00"
                    placeholderTextColor={Colors.gray400}
                    value={pickupStart}
                    onChangeText={setPickupStart}
                  />
                </View>
                <Text style={s.timeDash}>–</Text>
                <View style={[s.timeBox, { flex: 1 }]}>
                  <Text style={s.timeLabel}>End (24h)</Text>
                  <TextInput
                    style={s.timeInput}
                    placeholder="21:00"
                    placeholderTextColor={Colors.gray400}
                    value={pickupEnd}
                    onChangeText={setPickupEnd}
                  />
                </View>
              </View>
            </View>

            {/* Quantity Available */}
            <View style={s.field}>
              <Text style={s.label}>Quantity Available</Text>
              <TextInput
                style={s.input}
                placeholder="5"
                placeholderTextColor={Colors.gray400}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Publish CTA */}
      <View style={s.bottomCta}>
        <TouchableOpacity
          style={[s.publishBtn, loading && s.publishBtnOff]}
          onPress={handlePublish}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={s.publishTxt}>{loading ? 'Publishing...' : 'Publish Surprise Bag'}</Text>
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
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  content: { padding: Sp.base, gap: Sp.base },
  discountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySurface,
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '50',
  },
  discountPreviewTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.primary,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    gap: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  field: { gap: 6 },
  label: { fontFamily: Font.bold, fontSize: Sz.xs, color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: R.lg,
    paddingHorizontal: Sp.base,
    height: 48,
    fontFamily: Font.medium,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  sellingPriceInput: {
    borderColor: Colors.primary,
    fontFamily: Font.bold,
    color: Colors.primary,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catTxt: { fontFamily: Font.medium, fontSize: 10, color: Colors.textSecondary },
  catTxtActive: { color: Colors.white, fontFamily: Font.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm },
  timeBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: R.lg,
    padding: Sp.sm,
    backgroundColor: Colors.surface,
  },
  timeLabel: { fontFamily: Font.regular, fontSize: 10, color: Colors.textTertiary },
  timeInput: { fontFamily: Font.bold, fontSize: Sz.sm, color: Colors.textPrimary, paddingVertical: 2 },
  timeDash: { fontFamily: Font.bold, fontSize: Sz.lg, color: Colors.textTertiary },
  bottomCta: {
    paddingHorizontal: Sp.base,
    paddingBottom: Sp.base,
    paddingTop: Sp.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  publishBtn: {
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
  publishBtnOff: { backgroundColor: Colors.gray300, shadowOpacity: 0, elevation: 0 },
  publishTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.white,
  },
});
