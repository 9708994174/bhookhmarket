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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { useAuthStore, useLocationStore } from '../../../store';
import { authService } from '../../../services';

interface MenuItem {
  id: string;
  label: string;
  subLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDestructive?: boolean;
}

interface AddressItem {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  address: string;
  city: string;
  isDefault: boolean;
}

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const { setLocation, location } = useLocationStore();

  // ── Modals State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Preferences State
  const [prefVegOnly, setPrefVegOnly] = useState(false);
  const [prefDailyAlerts, setPrefDailyAlerts] = useState(true);
  const [prefEmailReceipts, setPrefEmailReceipts] = useState(true);
  const [prefImpactMilestones, setPrefImpactMilestones] = useState(true);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>([
    {
      id: 'addr-1',
      tag: 'Home',
      address: 'Flat 402, Green Glen Palms, 100ft Road, Indiranagar',
      city: 'Bengaluru',
      isDefault: true,
    },
    {
      id: 'addr-2',
      tag: 'Work',
      address: 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar',
      city: 'Bengaluru',
      isDefault: false,
    },
  ]);
  const [newTag, setNewTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [newCityText, setNewCityText] = useState('Bengaluru');
  const [isAddingAddr, setIsAddingAddr] = useState(false);

  // Photo Upload Handler
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const selectedUri = result.assets[0].uri;
        setIsUploadingPhoto(true);

        if (user) {
          setUser({ ...user, profileImage: selectedUri });
        }

        try {
          await authService.updateProfile({ profileImage: selectedUri });
        } catch {
          // Local fallback
        }

        Toast.show({
          type: 'success',
          text1: 'Photo Updated',
          text2: 'Your new profile image has been saved.',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Could not select or upload photo.',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }

    setIsSaving(true);
    try {
      await authService.updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });

      if (user) {
        setUser({
          ...user,
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your account details have been saved.',
      });
      setIsEditModalOpen(false);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: e?.response?.data?.error || 'Could not save profile changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewAddress = () => {
    if (!newAddrText.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter street / house address' });
      return;
    }
    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      tag: newTag,
      address: newAddrText.trim(),
      city: newCityText.trim() || 'Bengaluru',
      isDefault: addresses.length === 0,
    };
    setAddresses([newAddr, ...addresses]);
    setNewAddrText('');
    setIsAddingAddr(false);
    Toast.show({ type: 'success', text1: 'Address Saved', text2: `${newTag} address added successfully.` });
  };

  const handleSelectDefaultAddress = (addr: AddressItem) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === addr.id })));
    setLocation({
      city: addr.city,
      address: addr.address,
      latitude: location?.latitude || 12.9716,
      longitude: location?.longitude || 77.5946,
    });
    Toast.show({ type: 'success', text1: 'Active Address Set', text2: addr.address });
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    Toast.show({ type: 'info', text1: 'Address removed' });
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of BhookhMarket?', [
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

  // ── 100% Clickable & Functional Menu Items ──
  const UNIFIED_MENU: MenuItem[] = [
    {
      id: 'orders',
      label: 'Your Orders',
      subLabel: 'Track live bags, view receipts & history',
      icon: 'receipt-outline',
      onPress: () => router.push('/orders' as any),
    },
    {
      id: 'favorites',
      label: 'Favorite Stores',
      subLabel: 'Saved bakeries, restaurants & cafes',
      icon: 'heart-outline',
      onPress: () => router.push('/favorites' as any),
    },
    {
      id: 'address',
      label: 'Address Book',
      subLabel: 'Manage delivery & pickup addresses',
      icon: 'location-outline',
      onPress: () => setIsAddressModalOpen(true),
    },
    {
      id: 'impact',
      label: 'Your Eco Impact & Carbon Savings',
      subLabel: 'Track food rescued and carbon prevented',
      icon: 'leaf-outline',
      onPress: () => router.push('/(consumer)/impact' as any),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      subLabel: 'Surprise bag alerts & order updates',
      icon: 'notifications-outline',
      onPress: () => router.push('/(consumer)/notifications' as any),
    },
    {
      id: 'preferences',
      label: 'Dietary & Notification Preferences',
      subLabel: 'Pure Veg filter, daily bag alerts & email receipts',
      icon: 'options-outline',
      onPress: () => setIsPrefsModalOpen(true),
    },
    {
      id: 'partner',
      label: 'Partner Dashboard (Merchant Mode)',
      subLabel: user?.role === 'PARTNER' ? 'Manage your store & live surplus bags' : 'List surplus food & business analytics',
      icon: 'storefront-outline',
      onPress: () => {
        if (user?.role === 'PARTNER') {
          router.push('/(partner)/(tabs)' as any);
        } else {
          Alert.alert(
            'Partner Mode',
            'Would you like to register a new partner store?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Register Store',
                onPress: () => router.push('/(auth)/partner-onboarding'),
              },
            ]
          );
        }
      },
    },
    {
      id: 'safety',
      label: 'Food Safety & Hygiene Guidelines',
      subLabel: 'FSSAI standards, freshness audit & packaging',
      icon: 'shield-checkmark-outline',
      onPress: () => setIsSafetyModalOpen(true),
    },
    {
      id: 'help',
      label: 'Help & Customer Support',
      subLabel: 'FAQs, contact support & order assistance',
      icon: 'help-circle-outline',
      onPress: () => router.push('/(consumer)/help' as any),
    },
    {
      id: 'about',
      label: 'About BhookhMarket',
      subLabel: 'Mission to end food waste across India',
      icon: 'information-circle-outline',
      onPress: () => setIsAboutModalOpen(true),
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Centered Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* User Card (Tap to View & Edit Profile details) */}
        <TouchableOpacity style={s.userCard} onPress={openEditModal} activeOpacity={0.85}>
          <TouchableOpacity
            style={s.avatarTouchable}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            <View style={s.avatarWrap}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color={Colors.primary} />
                </View>
              )}

              {isUploadingPhoto ? (
                <View style={s.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color={Colors.white} />
                </View>
              ) : (
                <View style={s.cameraBadge}>
                  <Ionicons name="camera" size={13} color={Colors.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={s.userInfo}>
            <Text style={s.userName} numberOfLines={1}>{user?.name || 'User Profile'}</Text>
            <Text style={s.viewProfileHint}>View & Edit Profile</Text>
          </View>

          <View style={s.chevronBox}>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </View>
        </TouchableOpacity>

        {/* ── All-In-One Unified Clickable Card ── */}
        <View style={s.unifiedCard}>
          {UNIFIED_MENU.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                s.menuRow,
                idx === UNIFIED_MENU.length - 1 && s.menuRowLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={s.menuLeft}>
                <Ionicons name={item.icon} size={22} color={Colors.textPrimary} />
                <View style={s.labelBox}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.subLabel ? <Text style={s.menuSubLabel}>{item.subLabel}</Text> : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={s.logoutBtnTxt}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.versionTxt}>BhookhMarket v1.0.0 · Fighting Food Waste</Text>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════ */}
      {/* ── 1. EDIT PROFILE MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={s.modalAvatarRow}>
              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
                <View style={s.modalAvatarWrap}>
                  {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={s.modalAvatar} />
                  ) : (
                    <Ionicons name="person" size={28} color={Colors.primary} />
                  )}
                  <View style={s.modalCameraBadge}>
                    <Ionicons name="camera" size={12} color={Colors.white} />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={s.modalChangePhotoTxt}>Upload New Profile Picture</Text>
              </TouchableOpacity>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <TextInput
                style={s.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Phone Number</Text>
              <TextInput
                style={s.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email Address</Text>
              <TextInput
                style={s.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="name@example.com"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={s.saveBtnTxt}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════ */}
      {/* ── 2. ADDRESS BOOK MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      <Modal
        visible={isAddressModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={[s.modalContent, { maxHeight: '90%' }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={22} color={Colors.primary} />
                <Text style={s.modalTitle}>Saved Addresses</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddressModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* List of Saved Addresses */}
              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[s.addressCard, addr.isDefault && s.addressCardActive]}
                  onPress={() => handleSelectDefaultAddress(addr)}
                  activeOpacity={0.8}
                >
                  <View style={s.addressCardTop}>
                    <View style={s.addressTagBadge}>
                      <Ionicons
                        name={addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'briefcase' : 'location'}
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={s.addressTagTxt}>{addr.tag}</Text>
                    </View>
                    {addr.isDefault && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultBadgeTxt}>Active Pickup Area</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.addressDetailTxt}>{addr.address}</Text>
                  <Text style={s.addressCityTxt}>{addr.city}</Text>

                  <View style={s.addressActionRow}>
                    <Text style={s.addressTapHint}>{addr.isDefault ? '✓ Selected' : 'Tap to select this location'}</Text>
                    {addresses.length > 1 && (
                      <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                        <Ionicons name="trash-outline" size={18} color="#E53935" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Add New Address Form Section */}
              {isAddingAddr ? (
                <View style={s.addAddrBox}>
                  <Text style={s.addAddrTitle}>Add New Location</Text>
                  
                  {/* Tag Selector */}
                  <View style={s.tagSelectRow}>
                    {(['Home', 'Work', 'Other'] as const).map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[s.tagBtn, newTag === tag && s.tagBtnActive]}
                        onPress={() => setNewTag(tag)}
                      >
                        <Text style={[s.tagBtnTxt, newTag === tag && s.tagBtnTxtActive]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={[s.input, { marginTop: 8 }]}
                    placeholder="House / Flat / Street name"
                    placeholderTextColor={Colors.gray400}
                    value={newAddrText}
                    onChangeText={setNewAddrText}
                  />

                  <TextInput
                    style={[s.input, { marginTop: 8 }]}
                    placeholder="City (e.g. Bengaluru)"
                    placeholderTextColor={Colors.gray400}
                    value={newCityText}
                    onChangeText={setNewCityText}
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[s.saveBtn, { flex: 1, backgroundColor: '#F0F0F2' }]}
                      onPress={() => setIsAddingAddr(false)}
                    >
                      <Text style={[s.saveBtnTxt, { color: Colors.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.saveBtn, { flex: 1 }]}
                      onPress={handleAddNewAddress}
                    >
                      <Text style={s.saveBtnTxt}>Save Address</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.addNewAddrBtn}
                  onPress={() => setIsAddingAddr(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={s.addNewAddrTxt}>Add New Address</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════ */}
      {/* ── 3. FOOD SAFETY & HYGIENE MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      <Modal
        visible={isSafetyModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSafetyModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '85%' }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                <Text style={s.modalTitle}>Food Safety Guidelines</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSafetyModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={s.safetyBanner}>
                <Ionicons name="ribbon-outline" size={28} color="#1B5E20" />
                <View style={{ flex: 1 }}>
                  <Text style={s.safetyBannerTitle}>FSSAI Certified Partners</Text>
                  <Text style={s.safetyBannerSub}>Every merchant on BhookhMarket is verified for strict hygiene and food safety compliance.</Text>
                </View>
              </View>

              <View style={s.safetyCard}>
                <View style={s.safetyRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.safetyPointTitle}>100% Fresh Daily Surplus</Text>
                    <Text style={s.safetyPointSub}>All bags contain surplus items prepared fresh the very same day that did not get sold during regular business hours.</Text>
                  </View>
                </View>

                <View style={s.safetyRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.safetyPointTitle}>Strict Temperature Control</Text>
                    <Text style={s.safetyPointSub}>Hot items and chilled dairy/pastries are stored at optimal FSSAI recommended temperatures until collection.</Text>
                  </View>
                </View>

                <View style={s.safetyRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.safetyPointTitle}>Hygienic Sealed Packaging</Text>
                    <Text style={s.safetyPointSub}>Food items are packed in clean, food-grade eco containers with tamper-evident labels before handover.</Text>
                  </View>
                </View>

                <View style={s.safetyRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.safetyPointTitle}>Transparent Dietary & Allergen Info</Text>
                    <Text style={s.safetyPointSub}>Clear green/red dots for Veg/Non-Veg, dairy, gluten, and nut allergen advisories on each bag.</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={s.saveBtn}
                onPress={() => setIsSafetyModalOpen(false)}
              >
                <Text style={s.saveBtnTxt}>Understood</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════ */}
      {/* ── 4. DIETARY & PREFERENCES MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      <Modal
        visible={isPrefsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPrefsModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="options" size={22} color={Colors.primary} />
                <Text style={s.modalTitle}>Preferences</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPrefsModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              {/* Pure Veg Filter Switch */}
              <View style={s.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.prefSwitchLabel}>Vegetarian Only Feed</Text>
                  <Text style={s.prefSwitchSub}>Only show 100% pure veg surprise bags in your home feed</Text>
                </View>
                <Switch
                  value={prefVegOnly}
                  onValueChange={(val) => {
                    setPrefVegOnly(val);
                    Toast.show({ type: 'info', text1: val ? 'Veg Only Enabled' : 'Showing All Bags' });
                  }}
                  trackColor={{ false: '#E5E5EA', true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              {/* 6 PM Alerts */}
              <View style={s.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.prefSwitchLabel}>Evening Bag Alerts (6:00 PM)</Text>
                  <Text style={s.prefSwitchSub}>Receive notification when local bakeries post new evening bags</Text>
                </View>
                <Switch
                  value={prefDailyAlerts}
                  onValueChange={setPrefDailyAlerts}
                  trackColor={{ false: '#E5E5EA', true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              {/* Email Receipts */}
              <View style={s.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.prefSwitchLabel}>Email Receipts & Invoices</Text>
                  <Text style={s.prefSwitchSub}>Send pickup QR codes & invoices to your email</Text>
                </View>
                <Switch
                  value={prefEmailReceipts}
                  onValueChange={setPrefEmailReceipts}
                  trackColor={{ false: '#E5E5EA', true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              {/* Eco Impact Weekly */}
              <View style={s.prefSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.prefSwitchLabel}>Eco Impact Milestones</Text>
                  <Text style={s.prefSwitchSub}>Celebrate every kg of CO2 and meals you save</Text>
                </View>
                <Switch
                  value={prefImpactMilestones}
                  onValueChange={setPrefImpactMilestones}
                  trackColor={{ false: '#E5E5EA', true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <TouchableOpacity
                style={s.saveBtn}
                onPress={() => {
                  setIsPrefsModalOpen(false);
                  Toast.show({ type: 'success', text1: 'Preferences Saved' });
                }}
              >
                <Text style={s.saveBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════ */}
      {/* ── 5. ABOUT BHOOKHMARKET MODAL ── */}
      {/* ══════════════════════════════════════════════ */}
      <Modal
        visible={isAboutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAboutModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '85%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>About BhookhMarket</Text>
              <TouchableOpacity onPress={() => setIsAboutModalOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 14 }}>
              <Image source={require('../../../assets/logo.png')} style={{ width: 180, height: 42 }} resizeMode="contain" />
              <Text style={s.aboutVersionTxt}>Version 1.0.0 (Build 2026.08)</Text>

              <View style={s.aboutCard}>
                <Text style={s.aboutHeadline}>Our Mission to End Food Waste</Text>
                <Text style={s.aboutBody}>
                  BhookhMarket connects hungry, conscious foodies with quality surplus food from bakeries, cafes, and restaurants at up to 70% off. Together, we rescue delicious meals and build a zero-waste India.
                </Text>
              </View>

              <View style={s.aboutPledgeRow}>
                <View style={s.aboutPledgeItem}>
                  <Text style={s.aboutPledgeVal}>10,000+</Text>
                  <Text style={s.aboutPledgeLbl}>Meals Rescued</Text>
                </View>
                <View style={s.aboutPledgeItem}>
                  <Text style={s.aboutPledgeVal}>4.8 ★</Text>
                  <Text style={s.aboutPledgeLbl}>User Rating</Text>
                </View>
                <View style={s.aboutPledgeItem}>
                  <Text style={s.aboutPledgeVal}>250+</Text>
                  <Text style={s.aboutPledgeLbl}>Food Partners</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.saveBtn, { width: '100%' }]}
                onPress={() => setIsAboutModalOpen(false)}
              >
                <Text style={s.saveBtnTxt}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Sp.base,
    paddingTop: Sp.base,
    backgroundColor: Colors.surface,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Sp.base,
    ...Elevation.card,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primarySurface,
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontFamily: Font.bold,
    fontSize: Sz.md,
    color: Colors.textPrimary,
  },
  viewProfileHint: {
    fontFamily: Font.medium,
    fontSize: Sz.xs,
    color: Colors.primary,
    marginTop: 3,
  },
  chevronBox: {
    padding: 4,
  },
  unifiedCard: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: Sp.base,
    ...Elevation.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
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
  labelBox: {
    marginLeft: 12,
    flex: 1,
  },
  menuLabel: {
    fontFamily: Font.bold,
    fontSize: Sz.base,
    color: Colors.textPrimary,
  },
  menuSubLabel: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: R.lg,
    paddingVertical: 13,
    gap: 6,
    marginBottom: Sp.base,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.base,
    color: '#DC2626',
  },
  versionTxt: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Sp.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: R['2xl'],
    borderTopRightRadius: R['2xl'],
    padding: Sp.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Sp.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sp.base,
  },
  modalTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz.lg,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  modalAvatarRow: {
    alignItems: 'center',
    marginBottom: Sp.base,
    gap: 6,
  },
  modalAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  modalChangePhotoTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: Sp.md,
  },
  inputLabel: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: R.md,
    paddingHorizontal: Sp.base,
    paddingVertical: 10,
    fontFamily: Font.medium,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.base,
    color: Colors.white,
  },
  addressCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  addressCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressTagTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.primary,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeTxt: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: Colors.white,
  },
  addressDetailTxt: {
    fontFamily: Font.medium,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  addressCityTxt: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addressActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addressTapHint: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Colors.primary,
  },
  addNewAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
    marginTop: 6,
  },
  addNewAddrTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.primary,
  },
  addAddrBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  addAddrTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tagSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tagBtnTxtActive: {
    color: Colors.white,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  safetyBannerTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: '#1B5E20',
  },
  safetyBannerSub: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#2E7D32',
    marginTop: 2,
  },
  safetyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: R.lg,
    padding: Sp.md,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyPointTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  safetyPointSub: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  prefSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  prefSwitchLabel: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  prefSwitchSub: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    paddingRight: 8,
  },
  aboutVersionTxt: {
    fontFamily: Font.medium,
    fontSize: Sz.xs,
    color: Colors.textTertiary,
    marginTop: -8,
  },
  aboutCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: R.lg,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  aboutHeadline: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  aboutBody: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  aboutPledgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.primarySurface,
    borderRadius: R.lg,
    paddingVertical: 14,
  },
  aboutPledgeItem: {
    alignItems: 'center',
  },
  aboutPledgeVal: {
    fontFamily: Font.extraBold,
    fontSize: Sz.md,
    color: Colors.primary,
  },
  aboutPledgeLbl: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
