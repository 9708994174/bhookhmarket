import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { useAuthStore, useUIStore } from '../../../store';

const { width } = Dimensions.get('window');

export default function PartnerStoreProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const { setTabBarVisible } = useUIStore();

  const partner = user?.partnerProfile;

  // Modals state
  const [isOpenForBags, setIsOpenForBags] = useState(true);
  const [isStoreEditOpen, setIsStoreEditOpen] = useState(false);
  const [isPickupHoursOpen, setIsPickupHoursOpen] = useState(false);
  const [isFssaiOpen, setIsFssaiOpen] = useState(false);
  const [isBankingOpen, setIsBankingOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Store editable state
  const [businessName, setBusinessName] = useState(partner?.businessName || 'The Artisan Bakery & Cafe');
  const [category, setCategory] = useState(partner?.category || 'BAKERY');
  const [address, setAddress] = useState(partner?.address || '100ft Road, Indiranagar, Bengaluru');
  const [phone, setPhone] = useState(user?.phone || '8888888888');
  const [storeImage, setStoreImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80'
  );

  // Pickup hours state
  const [pickupStart, setPickupStart] = useState('18:00');
  const [pickupEnd, setPickupEnd] = useState('21:30');

  // Banking state
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNum, setAccountNum] = useState('50100482910482');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [upiId, setUpiId] = useState('artisanbakery@hdfcbank');

  // FSSAI state
  const [fssaiNum, setFssaiNum] = useState('11223344005566');

  const handlePickStoreImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission needed to upload store photo' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setStoreImage(result.assets[0].uri);
        Toast.show({ type: 'success', text1: 'Store Photo Updated' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not select photo' });
    }
  };

  const handleSaveStore = () => {
    if (user) {
      setUser({
        ...user,
        phone,
        partnerProfile: {
          ...partner,
          businessName,
          category,
          address,
          id: partner?.id ?? '',
          verificationStatus: 'VERIFIED',
          isActive: true,
        },
      });
    }
    setIsStoreEditOpen(false);
    Toast.show({ type: 'success', text1: 'Store Profile Saved' });
  };

  const handleSavePickupHours = () => {
    setIsPickupHoursOpen(false);
    Toast.show({ type: 'success', text1: 'Pickup Hours Updated', text2: `${pickupStart} – ${pickupEnd}` });
  };

  const handleSaveBanking = () => {
    setIsBankingOpen(false);
    Toast.show({ type: 'success', text1: 'Banking Details Updated' });
  };

  const handleSaveFssai = () => {
    setIsFssaiOpen(false);
    Toast.show({ type: 'success', text1: 'FSSAI License Verified', text2: `License #${fssaiNum}` });
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of merchant mode?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/splash');
        },
      },
    ]);
  };

  const lastScrollY = React.useRef(0);
  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (Math.abs(diff) > 8) {
      if (diff > 0 && currentY > 50) {
        setTabBarVisible(false);
      } else if (diff < 0) {
        setTabBarVisible(true);
      }
      lastScrollY.current = currentY;
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Centered Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Store Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── Store Info Card ── */}
        <TouchableOpacity style={s.storeCard} onPress={() => setIsStoreEditOpen(true)} activeOpacity={0.85}>
          <View style={s.storeAvatarWrap}>
            {storeImage ? (
              <Image source={{ uri: storeImage }} style={s.storeAvatar} />
            ) : (
              <MaterialCommunityIcons name="storefront" size={32} color="#1B5E20" />
            )}
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#1B5E20" />
            </View>
          </View>

          <View style={s.storeInfo}>
            <Text style={s.storeName} numberOfLines={1}>{partner?.businessName || 'The Artisan Bakery & Cafe'}</Text>
            <Text style={s.storeCategory}>{partner?.category || 'BAKERY'} · FSSAI Verified</Text>
            <Text style={s.editHint}>Tap to view & edit store info</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>

        {/* ── Live Store Status Toggle Card ── */}
        <View style={s.statusCard}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.statusCardTitle}>Surplus Orders Active</Text>
            <Text style={s.statusCardSub}>
              {isOpenForBags ? 'Your store is currently visible to nearby consumers' : 'Store is paused. No new bags can be ordered.'}
            </Text>
          </View>
          <Switch
            value={isOpenForBags}
            onValueChange={(val) => {
              setIsOpenForBags(val);
              Toast.show({ type: 'info', text1: val ? 'Store is Open for Orders' : 'Store is Paused' });
            }}
            trackColor={{ false: '#E5E5EA', true: '#1B5E20' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Settings & Management Options ── */}
        <View style={s.menuCard}>
          {/* Store Location & Pickup Address */}
          <TouchableOpacity style={s.menuRow} onPress={() => setIsStoreEditOpen(true)}>
            <View style={s.menuLeft}>
              <Ionicons name="location-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>Pickup Location</Text>
                <Text style={s.menuSubLabel}>{partner?.address || '100ft Road, Indiranagar, Bengaluru'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Operating Pickup Timings */}
          <TouchableOpacity style={s.menuRow} onPress={() => setIsPickupHoursOpen(true)}>
            <View style={s.menuLeft}>
              <Ionicons name="time-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>Surplus Pickup Hours</Text>
                <Text style={s.menuSubLabel}>{pickupStart} – {pickupEnd} (Daily window)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* FSSAI License & Hygiene Compliance */}
          <TouchableOpacity style={s.menuRow} onPress={() => setIsFssaiOpen(true)}>
            <View style={s.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>FSSAI License & Food Hygiene</Text>
                <Text style={s.menuSubLabel}>Verified · Lic #{fssaiNum}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Bank Account & Weekly Payouts */}
          <TouchableOpacity style={s.menuRow} onPress={() => setIsBankingOpen(true)}>
            <View style={s.menuLeft}>
              <Ionicons name="card-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>Bank Account & Weekly Payouts</Text>
                <Text style={s.menuSubLabel}>{bankName} · {accountNum.slice(-4)} (Every Monday)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Merchant Impact & Analytics */}
          <TouchableOpacity style={s.menuRow} onPress={() => setIsAnalyticsOpen(true)}>
            <View style={s.menuLeft}>
              <Ionicons name="stats-chart-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>Merchant Analytics & Impact</Text>
                <Text style={s.menuSubLabel}>142 meals rescued · ₹18,420 net revenue</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Merchant Support */}
          <TouchableOpacity style={[s.menuRow, s.menuRowLast]} onPress={() => router.push('/(consumer)/help' as any)}>
            <View style={s.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#1C1C1E" />
              <View style={s.menuTexts}>
                <Text style={s.menuLabel}>Merchant Support & Helpdesk</Text>
                <Text style={s.menuSubLabel}>Dedicated partner helpline & dispute support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={s.logoutBtnTxt}>Log Out Merchant Account</Text>
        </TouchableOpacity>

        <Text style={s.versionTxt}>BhookhMarket Merchant Partner v1.0.0</Text>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── 1. Store Edit Profile Modal ── */}
      <Modal visible={isStoreEditOpen} animationType="slide" transparent onRequestClose={() => setIsStoreEditOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setIsStoreEditOpen(false)} style={s.modalBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={s.modalTitleCentered}>Edit Store Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {/* Store Photo Upload */}
              <TouchableOpacity style={s.imageUploadBox} onPress={handlePickStoreImage}>
                {storeImage ? (
                  <Image source={{ uri: storeImage }} style={s.uploadedStoreImage} />
                ) : (
                  <View style={s.imageUploadPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color="#1B5E20" />
                    <Text style={s.imageUploadTxt}>Tap to upload store logo/photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Business / Store Name</Text>
                <TextInput style={s.input} value={businessName} onChangeText={setBusinessName} />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Business Category</Text>
                <TextInput style={s.input} value={category} onChangeText={setCategory} />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Store Contact Phone</Text>
                <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Pickup Address & Landmark</Text>
                <TextInput style={s.input} value={address} onChangeText={setAddress} multiline numberOfLines={2} />
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={handleSaveStore}>
                <Text style={s.saveBtnTxt}>Save Store Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 2. Pickup Hours Modal ── */}
      <Modal visible={isPickupHoursOpen} animationType="slide" transparent onRequestClose={() => setIsPickupHoursOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setIsPickupHoursOpen(false)} style={s.modalBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={s.modalTitleCentered}>Surplus Pickup Hours</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={{ gap: 14 }}>
              <Text style={s.modalSubText}>Set the daily time window when consumers can collect their Surprise Bags at your store.</Text>

              <View style={s.timeInputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Pickup Start Time</Text>
                  <TextInput style={s.input} value={pickupStart} onChangeText={setPickupStart} placeholder="18:00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Pickup End Time</Text>
                  <TextInput style={s.input} value={pickupEnd} onChangeText={setPickupEnd} placeholder="21:30" />
                </View>
              </View>

              {/* Quick Presets */}
              <Text style={s.inputLabel}>Quick Timing Presets</Text>
              <View style={s.presetsRow}>
                <TouchableOpacity
                  style={s.presetChip}
                  onPress={() => { setPickupStart('18:00'); setPickupEnd('21:00'); }}
                >
                  <Text style={s.presetChipTxt}>Evening 6:00 – 9:00 PM</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.presetChip}
                  onPress={() => { setPickupStart('20:00'); setPickupEnd('22:00'); }}
                >
                  <Text style={s.presetChipTxt}>Closing 8:00 – 10:00 PM</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={handleSavePickupHours}>
                <Text style={s.saveBtnTxt}>Update Pickup Window</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. FSSAI License Modal ── */}
      <Modal visible={isFssaiOpen} animationType="slide" transparent onRequestClose={() => setIsFssaiOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setIsFssaiOpen(false)} style={s.modalBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={s.modalTitleCentered}>FSSAI Food Safety</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={{ gap: 14 }}>
              <View style={s.fssaiBadgeBox}>
                <Ionicons name="shield-checkmark" size={32} color="#1B5E20" />
                <View style={{ flex: 1 }}>
                  <Text style={s.fssaiStatusTxt}>FSSAI Verified Merchant</Text>
                  <Text style={s.fssaiSubTxt}>Compliant with Food Safety and Standards Authority of India</Text>
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>14-Digit FSSAI License Number</Text>
                <TextInput style={s.input} value={fssaiNum} onChangeText={setFssaiNum} keyboardType="number-pad" />
              </View>

              <View style={s.hygieneChecklist}>
                <Text style={s.inputLabel}>Hygiene & Safety Standards</Text>
                <View style={s.hygieneItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#1B5E20" />
                  <Text style={s.hygieneTxt}>100% same-day fresh surplus food guarantee</Text>
                </View>
                <View style={s.hygieneItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#1B5E20" />
                  <Text style={s.hygieneTxt}>Tamper-evident sealed packaging before handover</Text>
                </View>
                <View style={s.hygieneItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#1B5E20" />
                  <Text style={s.hygieneTxt}>Temperature control & allergen labelling</Text>
                </View>
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={handleSaveFssai}>
                <Text style={s.saveBtnTxt}>Save FSSAI Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 4. Banking & Payouts Modal ── */}
      <Modal visible={isBankingOpen} animationType="slide" transparent onRequestClose={() => setIsBankingOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setIsBankingOpen(false)} style={s.modalBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={s.modalTitleCentered}>Bank Account & Payouts</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View style={s.payoutScheduleBox}>
                <Ionicons name="calendar-outline" size={22} color="#1565C0" />
                <View style={{ flex: 1 }}>
                  <Text style={s.payoutScheduleTitle}>Weekly Automatic Settlement</Text>
                  <Text style={s.payoutScheduleSub}>Earnings are directly credited every Monday morning with 0% platform delay.</Text>
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Bank Name</Text>
                <TextInput style={s.input} value={bankName} onChangeText={setBankName} />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Account Number</Text>
                <TextInput style={s.input} value={accountNum} onChangeText={setAccountNum} keyboardType="number-pad" />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>IFSC Code</Text>
                <TextInput style={s.input} value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>UPI ID (Instant Transfers)</Text>
                <TextInput style={s.input} value={upiId} onChangeText={setUpiId} />
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={handleSaveBanking}>
                <Text style={s.saveBtnTxt}>Save Banking Information</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 5. Analytics & Impact Modal ── */}
      <Modal visible={isAnalyticsOpen} animationType="slide" transparent onRequestClose={() => setIsAnalyticsOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setIsAnalyticsOpen(false)} style={s.modalBackBtn}>
                <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={s.modalTitleCentered}>Store Impact & Analytics</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={{ gap: 14 }}>
              <View style={s.analyticsStatsGrid}>
                <View style={s.analyticsStatCard}>
                  <Text style={s.analyticsStatVal}>142</Text>
                  <Text style={s.analyticsStatLbl}>Meals Rescued</Text>
                </View>

                <View style={s.analyticsStatCard}>
                  <Text style={s.analyticsStatVal}>₹18,420</Text>
                  <Text style={s.analyticsStatLbl}>Net Revenue</Text>
                </View>

                <View style={s.analyticsStatCard}>
                  <Text style={s.analyticsStatVal}>355 kg</Text>
                  <Text style={s.analyticsStatLbl}>CO2 Prevented</Text>
                </View>

                <View style={s.analyticsStatCard}>
                  <Text style={s.analyticsStatVal}>★ 4.9</Text>
                  <Text style={s.analyticsStatLbl}>Avg. Rating</Text>
                </View>
              </View>

              <View style={s.badgeCard}>
                <MaterialCommunityIcons name="medal-outline" size={28} color="#1B5E20" />
                <View style={{ flex: 1 }}>
                  <Text style={s.badgeTitle}>Zero Waste Champion Store</Text>
                  <Text style={s.badgeSub}>Ranked among Top 5% surplus bakery partners in Bengaluru</Text>
                </View>
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={() => setIsAnalyticsOpen(false)}>
                <Text style={s.saveBtnTxt}>Close Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    backgroundColor: '#F8F9FA',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    ...Elevation.card,
  },
  storeAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  storeName: {
    fontFamily: Font.extraBold,
    fontSize: 16,
    color: '#1C1C1E',
  },
  storeCategory: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#636366',
    marginTop: 2,
  },
  editHint: {
    fontFamily: Font.medium,
    fontSize: 11.5,
    color: '#1B5E20',
    marginTop: 3,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    ...Elevation.card,
  },
  statusCardTitle: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  statusCardSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden',
    ...Elevation.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTexts: {
    marginLeft: 12,
    flex: 1,
  },
  menuLabel: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  menuSubLabel: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  switchConsumerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: R.lg,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  switchConsumerTxt: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1565C0',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: R.lg,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#DC2626',
  },
  versionTxt: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#A0A0A5',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleCentered: {
    fontFamily: Font.extraBold,
    fontSize: 17,
    color: '#1C1C1E',
    textAlign: 'center',
    flex: 1,
  },
  modalSubText: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: '#636366',
    lineHeight: 18,
  },
  imageUploadBox: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageUploadPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  imageUploadTxt: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#1B5E20',
  },
  uploadedStoreImage: {
    width: '100%',
    height: '100%',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Font.medium,
    fontSize: 14,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  presetChipTxt: {
    fontFamily: Font.bold,
    fontSize: 11.5,
    color: '#1B5E20',
  },
  fssaiBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  fssaiStatusTxt: {
    fontFamily: Font.extraBold,
    fontSize: 14,
    color: '#1B5E20',
  },
  fssaiSubTxt: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#2E7D32',
    marginTop: 2,
  },
  hygieneChecklist: {
    gap: 8,
  },
  hygieneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hygieneTxt: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#3A3A3C',
    flex: 1,
  },
  payoutScheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  payoutScheduleTitle: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1565C0',
  },
  payoutScheduleSub: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#1976D2',
    marginTop: 2,
  },
  analyticsStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticsStatCard: {
    width: (width - 50) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    alignItems: 'center',
  },
  analyticsStatVal: {
    fontFamily: Font.extraBold,
    fontSize: 20,
    color: '#1B5E20',
  },
  analyticsStatLbl: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#636366',
    marginTop: 3,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeTitle: {
    fontFamily: Font.extraBold,
    fontSize: 14,
    color: '#1B5E20',
  },
  badgeSub: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#2E7D32',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
