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
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../constants/theme';
import { authService } from '../../services';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'BAKERY', label: 'Bakery & Pastry Shop', icon: 'bread-slice-outline', desc: 'Breads, cakes, croissants & baked goods' },
  { id: 'CAFE', label: 'Cafe & Coffee House', icon: 'coffee-outline', desc: 'Coffee, sandwiches, snacks & quick bites' },
  { id: 'RESTAURANT', label: 'Restaurant & Dining', icon: 'silverware-fork-knife', desc: 'Meals, curries, biryanis & dining surplus' },
  { id: 'HOTEL', label: 'Hotel & Buffet Kitchen', icon: 'food-variant', desc: 'Buffet surplus & banquet preparations' },
  { id: 'SUPERMARKET', label: 'Grocery & Supermarket', icon: 'cart-outline', desc: 'Dairy, fresh produce, fruits & packaged food' },
  { id: 'CLOUD_KITCHEN', label: 'Cloud Kitchen & Caterer', icon: 'pot-steam-outline', desc: 'Catering & commercial kitchen surplus' },
];

export default function PartnerSignupScreen() {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('BAKERY');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const selectedCategory = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const valid =
    fullName.trim().length >= 2 &&
    businessName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(phone.trim()) &&
    agreed;

  const handleSignup = async () => {
    if (!valid) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Form',
        text2: 'Please fill in store name, contact person, and 10-digit mobile number.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOtp(phone.trim());
      router.push({
        pathname: '/(auth)/partner-otp',
        params: {
          phone: phone.trim(),
          devOtp: response.data.devOtp,
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          category,
        },
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: e?.response?.data?.error ?? 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Fixed Top Header */}
      <View style={s.fixedHeader}>
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backPill}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#0B4D26" />
          </TouchableOpacity>
          <View style={s.headerTitleBadge}>
            <Text style={s.headerTitleTxt}>Sign Up</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Fixed Form Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* White Background Form Tile covering the screen */}
          <View style={s.formTile}>
            {/* 1. Store / Business Name */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Store / Business Name <Text style={s.req}>*</Text></Text>
              <View style={[s.inputPill, focusedField === 'store' && s.inputPillFocused]}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={focusedField === 'store' ? '#0B4D26' : '#8E8E93'}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.textInput}
                  placeholder="e.g. The Artisan Bakery"
                  placeholderTextColor="#8E8E93"
                  value={businessName}
                  onChangeText={setBusinessName}
                  onFocus={() => setFocusedField('store')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* 2. Business Category Selector (Opens Modal Above Form) */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Business Category <Text style={s.req}>*</Text></Text>
              
              <TouchableOpacity
                style={s.dropdownTrigger}
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.85}
              >
                <View style={s.dropdownLeft}>
                  <View style={s.dropdownIconCircle}>
                    <MaterialCommunityIcons
                      name={selectedCategory.icon as any}
                      size={18}
                      color="#0B4D26"
                    />
                  </View>
                  <View style={s.dropdownTextCol}>
                    <Text style={s.dropdownSelectedTitle}>{selectedCategory.label}</Text>
                    <Text style={s.dropdownSelectedDesc}>{selectedCategory.desc}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#0B4D26"
                />
              </TouchableOpacity>
            </View>

            {/* 3. Contact Person Name */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Contact Person Name <Text style={s.req}>*</Text></Text>
              <View style={[s.inputPill, focusedField === 'name' && s.inputPillFocused]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedField === 'name' ? '#0B4D26' : '#8E8E93'}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.textInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#8E8E93"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* 4. Mobile Phone Number */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Mobile Number <Text style={s.req}>*</Text></Text>
              <View style={[s.inputPill, focusedField === 'phone' && s.inputPillFocused]}>
                <View style={s.prefixBtn}>
                  <Ionicons name="call-outline" size={16} color="#636366" />
                  <Text style={s.prefixTxt}>+91</Text>
                  <Ionicons name="chevron-down" size={13} color="#636366" />
                </View>
                <View style={s.inputDivider} />
                <TextInput
                  style={s.textInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* 5. Email Address (Optional) */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Email Address <Text style={s.optTxt}>(Optional)</Text></Text>
              <View style={[s.inputPill, focusedField === 'email' && s.inputPillFocused]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedField === 'email' ? '#0B4D26' : '#8E8E93'}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.textInput}
                  placeholder="contact@business.com"
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={s.agreeRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, agreed && s.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={s.agreeText}>
                I agree to the <Text style={s.linkText}>Partner Terms & Conditions</Text> and food quality standards.
              </Text>
            </TouchableOpacity>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[
                s.continueBtn,
                (!valid || loading) && s.continueBtnDisabled,
                loading && s.continueBtnLoading,
              ]}
              onPress={handleSignup}
              disabled={!valid || loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <View style={{ width: 34 }} />
                  <Text style={s.continueTxt}>Verify Store & Continue</Text>
                  <View style={s.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#0B4D26" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Already have partner account */}
            <View style={s.loginRow}>
              <Text style={s.loginSub}>Already registered as a partner? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={s.loginBold}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Category Selection Modal (Pops Up Cleanly Above Form) ── */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalOpen(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.modalContent}>
                {/* Modal Header */}
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Select Business Category</Text>
                  <TouchableOpacity
                    onPress={() => setIsModalOpen(false)}
                    style={s.modalCloseBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color="#636366" />
                  </TouchableOpacity>
                </View>

                {/* Category Options List */}
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {CATEGORIES.map((item, idx) => {
                    const isSelected = item.id === category;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          s.modalItem,
                          idx === CATEGORIES.length - 1 && s.modalItemLast,
                          isSelected && s.modalItemActive,
                        ]}
                        onPress={() => {
                          setCategory(item.id);
                          setIsModalOpen(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={s.modalItemLeft}>
                          <View style={[s.modalItemIconBox, isSelected && s.modalItemIconBoxActive]}>
                            <MaterialCommunityIcons
                              name={item.icon as any}
                              size={20}
                              color={isSelected ? '#0B4D26' : '#636366'}
                            />
                          </View>
                          <View style={s.modalItemTexts}>
                            <Text style={[s.modalItemTitle, isSelected && s.modalItemTitleActive]}>
                              {item.label}
                            </Text>
                            <Text style={s.modalItemDesc}>{item.desc}</Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color="#0B4D26" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  fixedHeader: {
    backgroundColor: '#F6F7F9',
    paddingBottom: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    paddingBottom: 8,
    zIndex: 10,
  },
  backPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleTxt: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#0B4D26',
    letterSpacing: 0.2,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  formTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    ...Elevation.sm,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: '#1C1C1E',
    marginBottom: 6,
    marginLeft: 2,
  },
  req: {
    color: '#E53935',
    fontFamily: Font.bold,
  },
  optTxt: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  inputPillFocused: {
    borderColor: '#0B4D26',
    backgroundColor: '#FFFFFF',
    ...Elevation.sm,
  },
  inputIcon: {
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: Font.medium,
    color: '#1C1C1E',
  },
  prefixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefixTxt: {
    fontSize: 14.5,
    fontFamily: Font.semiBold,
    color: '#1C1C1E',
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#C7C7CC',
    marginHorizontal: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 52,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTextCol: {
    flex: 1,
  },
  dropdownSelectedTitle: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1C1C1E',
  },
  dropdownSelectedDesc: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0B4D26',
    borderColor: '#0B4D26',
  },
  agreeText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#636366',
    lineHeight: 16,
  },
  linkText: {
    fontFamily: Font.bold,
    color: '#0B4D26',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B4D26',
    borderRadius: 28,
    height: 52,
    paddingHorizontal: 10,
    ...Elevation.md,
    marginBottom: 12,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnLoading: {
    justifyContent: 'center',
  },
  continueTxt: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginSub: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#636366',
  },
  loginBold: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#0B4D26',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '75%',
    ...Elevation.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDF2',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1C1C1E',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  modalItemLast: {
    borderBottomWidth: 0,
  },
  modalItemActive: {
    backgroundColor: '#F5FAF6',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemIconBoxActive: {
    backgroundColor: '#E8F5E9',
  },
  modalItemTexts: {
    flex: 1,
  },
  modalItemTitle: {
    fontFamily: Font.semiBold,
    fontSize: 13.5,
    color: '#1C1C1E',
  },
  modalItemTitleActive: {
    fontFamily: Font.bold,
    color: '#0B4D26',
  },
  modalItemDesc: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
    marginTop: 2,
  },
});


