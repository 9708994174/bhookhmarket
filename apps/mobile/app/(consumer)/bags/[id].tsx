import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { bagService, orderService, favoriteService } from '../../../services';
import { useAuthStore, useLocationStore } from '../../../store';
import { DetailScreenSkeleton } from '../../../components/Skeletons';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;

export default function BagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const { location } = useLocationStore();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bag', id],
    queryFn: () => bagService.getById(id!, location?.latitude, location?.longitude),
    enabled: !!id,
  });

  const bag = data?.data?.data ?? data?.data;

  if (isLoading || !bag) {
    return <DetailScreenSkeleton />;
  }

  const discount =
    bag.discountPercent ??
    Math.round(((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100);

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const pickupDate = new Date(bag.pickupStart).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const canBuy = (bag.status === 'ACTIVE' || bag.status === 'LOW_STOCK' || !bag.status) && (bag.remainingQuantity > 0);
  const maxQty = Math.min(bag.remainingQuantity || 5, 5);

  const itemSubtotal = bag.sellingPrice * qty;
  const platformFee = bag.platformFee ?? 5;
  const totalAmount = itemSubtotal + platformFee;
  const totalSavings = (bag.originalValue - bag.sellingPrice) * qty;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${bag.title} from ${bag.partner.businessName} at ₹${bag.sellingPrice} (${discount}% OFF) on BhookhMarket!`,
      });
    } catch {}
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setBuying(true);
    try {
      const res = await orderService.create(bag.id, qty);
      const order = res.data.data;
      router.push(`/(consumer)/checkout/${bag.id}?orderId=${order.id}` as any);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not create order',
        text2: e?.response?.data?.error ?? 'Please check your connection and try again.',
      });
    } finally {
      setBuying(false);
    }
  };

  const toggleFavorite = async () => {
    if (!bag?.partner?.id) return;
    try {
      if (isFav) {
        await favoriteService.remove(bag.partner.id);
        setIsFav(false);
        Toast.show({ type: 'info', text1: 'Removed from Favorites' });
      } else {
        await favoriteService.add(bag.partner.id);
        setIsFav(true);
        Toast.show({ type: 'success', text1: 'Added to Favorites' });
      }
    } catch {
      setIsFav(!isFav);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={s.heroBox}>
        {bag.imageUrl ? (
          <Image source={{ uri: bag.imageUrl }} style={s.heroImg} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#2E7D32', '#1B5E20']} style={s.heroImg}>
            <MaterialCommunityIcons name="food-takeout-box" size={80} color={Colors.white} />
          </LinearGradient>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={s.heroGradTop}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={s.heroGradBottom}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <SafeAreaView edges={['top']} style={s.heroNav}>
          <TouchableOpacity
            style={s.navCircleBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={s.navCircleBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.navCircleBtn, isFav && s.navCircleBtnFav]}
              onPress={toggleFavorite}
              activeOpacity={0.8}
            >
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={s.heroBadgesRow}>
          <View style={s.discountBadge}>
            <Text style={s.discountBadgeTxt}>{discount}% OFF</Text>
          </View>

          {bag.remainingQuantity <= 3 ? (
            <View style={s.urgencyBadge}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
              <Text style={s.urgencyBadgeTxt}>Only {bag.remainingQuantity} left</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
        <View style={s.contentContainer}>
          {/* Restaurant Header Card */}
          <View style={s.restaurantCard}>
            <View style={s.restaurantLeft}>
              <View style={s.restaurantIconCircle}>
                <MaterialCommunityIcons name="storefront" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.restaurantName} numberOfLines={1}>
                  {bag.partner.businessName}
                </Text>
                <View style={s.restaurantMetaRow}>
                  <View style={s.ratingPill}>
                    <Ionicons name="star" size={12} color="#FFB300" />
                    <Text style={s.ratingTxt}>{bag.partner.rating?.toFixed(1) ?? '4.8'}</Text>
                  </View>
                  <Text style={s.metaDot}>•</Text>
                  <Text style={s.categoryTxt}>{bag.category || bag.partner.category || 'Surplus Meal'}</Text>
                  {bag.distance != null && (
                    <>
                      <Text style={s.metaDot}>•</Text>
                      <Text style={s.distanceTxt}>{bag.distance} km away</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* FSSAI Verified Badge */}
            <View style={s.verifiedTag}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={s.verifiedTxt}>FSSAI Verified</Text>
            </View>
          </View>

          {/* Bag Title & Large Price Hero Card */}
          <View style={s.bagMainCard}>
            <View style={s.dietaryRow}>
              {bag.dietaryType === 'VEG' || bag.isVegetarian ? (
                <View style={s.vegTag}>
                  <View style={s.vegDot} />
                  <Text style={s.vegTxt}>100% PURE VEG</Text>
                </View>
              ) : (
                <View style={s.nonVegTag}>
                  <View style={s.nonVegDot} />
                  <Text style={s.nonVegTxt}>NON-VEG / CONTAINS EGG</Text>
                </View>
              )}
            </View>

            <Text style={s.bagTitle}>{bag.title}</Text>

            {/* Pricing Details */}
            <View style={s.priceBox}>
              <View style={s.priceRow}>
                <Text style={s.sellingPriceTxt}>₹{bag.sellingPrice}</Text>
                <Text style={s.originalPriceTxt}>₹{bag.originalValue}</Text>
                <View style={s.savePill}>
                  <Text style={s.savePillTxt}>Save ₹{bag.originalValue - bag.sellingPrice}</Text>
                </View>
              </View>
              <Text style={s.priceSub}>Inclusive of all taxes & surplus discount</Text>
            </View>

            {/* Quantity Stepper Selector */}
            <View style={s.qtySelectorCard}>
              <View>
                <Text style={s.qtySelectLabel}>Quantity</Text>
                <Text style={s.qtySelectSub}>
                  {canBuy ? `${bag.remainingQuantity} surprise bags available` : 'Sold out'}
                </Text>
              </View>

              <View style={s.stepperBox}>
                <TouchableOpacity
                  style={[s.stepBtn, qty <= 1 && s.stepBtnDisabled]}
                  onPress={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={qty <= 1 ? '#C7C7CC' : '#1C1C1E'} />
                </TouchableOpacity>

                <View style={s.stepValWrap}>
                  <Text style={s.stepVal}>{qty}</Text>
                </View>

                <TouchableOpacity
                  style={[s.stepBtn, (qty >= maxQty || !canBuy) && s.stepBtnDisabled]}
                  onPress={() => setQty(Math.min(maxQty, qty + 1))}
                  disabled={qty >= maxQty || !canBuy}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={qty >= maxQty || !canBuy ? '#C7C7CC' : '#1C1C1E'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── 3. Pickup Schedule Card ── */}
          <View style={s.pickupCard}>
            <View style={s.pickupHeader}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={s.pickupHeaderTitle}>Pickup Schedule</Text>
            </View>

            <View style={s.pickupTimeRow}>
              <View style={s.pickupTimeBlock}>
                <Text style={s.pickupDateTxt}>{pickupDate}</Text>
                <Text style={s.pickupWindowTxt}>
                  {fmt(bag.pickupStart)} – {fmt(bag.pickupEnd)}
                </Text>
              </View>
              <View style={s.pickupBadge}>
                <Text style={s.pickupBadgeTxt}>Store Pickup</Text>
              </View>
            </View>

            <View style={s.addressRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={s.addressTxt} numberOfLines={2}>
                {bag.partner.address || 'Indiranagar'}, {bag.partner.city || 'Bengaluru'}
              </Text>
            </View>
          </View>

          {/* ── 4. Surprise Bag Description & What's Inside ── */}
          <View style={s.infoCard}>
            <View style={s.infoHeader}>
              <MaterialCommunityIcons name="gift-outline" size={20} color={Colors.primary} />
              <Text style={s.infoHeaderTitle}>What you will receive</Text>
            </View>
            <Text style={s.descriptionTxt}>
              {bag.description ??
                "A delicious assortment of freshly prepared daily surplus meals and bakery specialties packed right before closing time."}
            </Text>

            <View style={s.perksRow}>
              <View style={s.perkItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={s.perkTxt}>Freshly prepared today</Text>
              </View>
              <View style={s.perkItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={s.perkTxt}>Hygienic sealed packaging</Text>
              </View>
              <View style={s.perkItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={s.perkTxt}>Eco carbon saver</Text>
              </View>
            </View>
          </View>

          {/* ── 5. Detailed Bill Summary Card ── */}
          <View style={s.billCard}>
            <Text style={s.billTitle}>Bill Summary</Text>

            <View style={s.billRow}>
              <Text style={s.billLabel}>Item Subtotal ({qty} {qty === 1 ? 'Bag' : 'Bags'})</Text>
              <Text style={s.billVal}>₹{itemSubtotal}</Text>
            </View>

            <View style={s.billRow}>
              <Text style={s.billLabel}>Platform & Eco Packaging Fee</Text>
              <Text style={s.billVal}>₹{platformFee}</Text>
            </View>

            <View style={s.billDivider} />

            <View style={s.billTotalRow}>
              <Text style={s.billTotalLabel}>To Pay</Text>
              <Text style={s.billTotalVal}>₹{totalAmount}</Text>
            </View>

            <View style={s.savingsBanner}>
              <Ionicons name="sparkles" size={15} color="#1B5E20" />
              <Text style={s.savingsBannerTxt}>
                Total savings on this order: ₹{totalSavings}
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* ── 6. Floating Rounded Action / Pay Pill (Like Navigation) ── */}
      <View style={s.ctaOuterWrapper} pointerEvents="box-none">
        <View style={s.ctaFloatingPill}>
          <View style={s.ctaPriceBox}>
            <Text style={s.ctaTotalLabel}>Total to Pay</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={s.ctaTotalVal}>₹{totalAmount}</Text>
              <Text style={s.ctaQtyHint}>({qty} {qty === 1 ? 'Bag' : 'Bags'})</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.payBtn, (!canBuy || buying) && s.payBtnDisabled]}
            onPress={handleBuy}
            disabled={!canBuy || buying}
            activeOpacity={0.88}
          >
            {buying ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={s.payBtnContent}>
                <Text style={s.payBtnTxt}>
                  {canBuy ? 'Reserve & Pay' : 'Sold Out'}
                </Text>
                {canBuy && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroBox: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#1C1C1E',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradTop: {
    ...StyleSheet.absoluteFill,
    height: '50%',
  },
  heroGradBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  navCircleBtnFav: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  heroBadgesRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  discountBadgeTxt: {
    fontFamily: Font.extraBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyBadgeTxt: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10,
    ...Elevation.card,
  },
  restaurantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restaurantIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantName: {
    fontFamily: Font.extraBold,
    fontSize: 16.5,
    color: '#1C1C1E',
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#1C1C1E',
  },
  metaDot: {
    color: '#C7C7CC',
    fontSize: 12,
  },
  categoryTxt: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#636366',
  },
  distanceTxt: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#636366',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#1B5E20',
  },
  bagMainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 12,
    ...Elevation.card,
  },
  dietaryRow: {
    flexDirection: 'row',
  },
  vegTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  vegTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#2E7D32',
  },
  nonVegTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  nonVegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  nonVegTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#D32F2F',
  },
  bagTitle: {
    fontFamily: Font.extraBold,
    fontSize: 20,
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  priceBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  sellingPriceTxt: {
    fontFamily: Font.extraBold,
    fontSize: 26,
    color: '#1B5E20',
  },
  originalPriceTxt: {
    fontFamily: Font.medium,
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  savePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savePillTxt: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#1B5E20',
  },
  priceSub: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
  },
  qtySelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  qtySelectLabel: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  qtySelectSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 3,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepBtnDisabled: {
    backgroundColor: '#E5E5EA',
    elevation: 0,
    shadowOpacity: 0,
  },
  stepValWrap: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontFamily: Font.extraBold,
    fontSize: 16,
    color: '#1C1C1E',
  },
  pickupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10,
    ...Elevation.card,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupHeaderTitle: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  pickupTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  pickupTimeBlock: {
    gap: 2,
  },
  pickupDateTxt: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#1C1C1E',
  },
  pickupWindowTxt: {
    fontFamily: Font.extraBold,
    fontSize: 15,
    color: '#1B5E20',
  },
  pickupBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pickupBadgeTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#1B5E20',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  addressTxt: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#636366',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10,
    ...Elevation.card,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoHeaderTitle: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  descriptionTxt: {
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  perksRow: {
    gap: 6,
    marginTop: 4,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkTxt: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#2E7D32',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 10,
    ...Elevation.card,
  },
  billTitle: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: '#636366',
  },
  billVal: {
    fontFamily: Font.medium,
    fontSize: 13.5,
    color: '#1C1C1E',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontFamily: Font.extraBold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  billTotalVal: {
    fontFamily: Font.extraBold,
    fontSize: 18,
    color: '#1B5E20',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  savingsBannerTxt: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#1B5E20',
  },
  ctaOuterWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 22,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  ctaFloatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Math.min(width * 0.90, 360),
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaPriceBox: {
    gap: 1,
  },
  ctaTotalLabel: {
    fontFamily: Font.medium,
    fontSize: 10.5,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaTotalVal: {
    fontFamily: Font.extraBold,
    fontSize: 20,
    color: '#1B5E20',
  },
  ctaQtyHint: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: '#8E8E93',
  },
  payBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payBtnDisabled: {
    backgroundColor: '#A0A0A5',
    elevation: 0,
  },
  payBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 15.5,
    color: '#FFFFFF',
  },
});
