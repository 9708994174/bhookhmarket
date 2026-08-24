import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  Modal,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { useAuthStore, useLocationStore, useUIStore } from '../../../store';
import { bagService } from '../../../services';
import { BagCardSkeleton } from '../../../components/Skeletons';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 330;

// ── 3 High-Quality Zomato-Style Real Food Photography Banners ────────────────
const HERO_BANNERS = [
  {
    id: 'b1',
    tag: 'FRESH SURPLUS',
    title: 'Artisan Bakery Bags',
    subtitle: 'Croissants, sourdough & pastries up to 70% off',
    priceTag: 'From ₹89',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 'b2',
    tag: 'CHEF PICKS',
    title: "Tonight's Gourmet Meals",
    subtitle: 'Rescue chef-crafted surplus boxes from top cafes',
    priceTag: 'From ₹129',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 'b3',
    tag: 'ZERO WASTE',
    title: 'Fresh Grocery Boxes',
    subtitle: 'Daily farm fruits & organic dairy surprise bundles',
    priceTag: 'From ₹99',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000&auto=format&fit=crop&q=80',
  },
];

// ── Category pills with Vector Icons ─────────────────────────────────────────
const CATS = [
  { id: 'ALL',         label: 'All',          icon: 'grid-outline',           lib: 'ion' },
  { id: 'BAKERY',      label: 'Bakeries',     icon: 'bread-slice-outline',    lib: 'mci' },
  { id: 'CAFE',        label: 'Cafes',        icon: 'coffee-outline',         lib: 'mci' },
  { id: 'RESTAURANT',  label: 'Restaurants',  icon: 'silverware-fork-knife',  lib: 'mci' },
  { id: 'HOTEL',       label: 'Buffets',      icon: 'food-variant',           lib: 'mci' },
  { id: 'SUPERMARKET', label: 'Groceries',    icon: 'cart-outline',           lib: 'ion' },
  { id: 'CATERER',     label: 'Catering',     icon: 'pot-steam-outline',      lib: 'mci' },
] as const;

// ── Single Bag Card with Signature Green Rescue Button ───────────────────────
function BagCard({ bag, onPress }: { bag: any; onPress: () => void }) {
  const discount =
    bag.discountPercent ??
    Math.round(((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100);

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isLow = bag.remainingQuantity === 1 || bag.remainingQuantity === 2;
  const isSold = bag.remainingQuantity === 0;

  return (
    <TouchableOpacity style={bc.card} onPress={onPress} activeOpacity={0.93}>
      {/* Image / Banner */}
      <View style={bc.imgBox}>
        {bag.imageUrl ? (
          <Image source={{ uri: bag.imageUrl }} style={bc.img} resizeMode="cover" />
        ) : (
          <View style={[bc.img, bc.imgPlaceholder]}>
            <MaterialCommunityIcons name="shopping" size={48} color={Colors.primary} />
          </View>
        )}

        {/* Discount badge */}
        <View style={bc.discBadge}>
          <Text style={bc.discTxt}>{discount}% OFF</Text>
        </View>

        {/* Low stock */}
        {isLow && !isSold && (
          <View style={bc.lowBadge}>
            <Text style={bc.lowTxt}>Only {bag.remainingQuantity} left</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={bc.info}>
        {/* Restaurant name + distance */}
        <View style={bc.topRow}>
          <Text style={bc.restaurant} numberOfLines={1}>
            {bag.partner?.businessName || 'Local Partner'}
          </Text>
          {bag.distance != null && (
            <View style={bc.distBadge}>
              <Ionicons name="location-sharp" size={12} color={Colors.gray500} />
              <Text style={bc.distance}>{bag.distance} km</Text>
            </View>
          )}
        </View>

        <Text style={bc.bagName} numberOfLines={1}>
          {bag.title}
        </Text>

        {/* Rating + pickup */}
        <View style={bc.metaRow}>
          <View style={bc.starRow}>
            <Ionicons name="star" size={13} color="#FFB300" />
            <Text style={bc.ratingTxt}>{bag.partner?.rating?.toFixed(1) ?? '4.8'}</Text>
          </View>
          <View style={bc.dot} />
          <View style={bc.timeRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={bc.pickupTxt}>
              {fmt(bag.pickupStart)} – {fmt(bag.pickupEnd)}
            </Text>
          </View>
        </View>

        {/* Price & Green Rescue Button */}
        <View style={bc.priceRow}>
          <View style={bc.prices}>
            <Text style={bc.sellingPrice}>₹{bag.sellingPrice}</Text>
            <Text style={bc.origPrice}>₹{bag.originalValue}</Text>
          </View>
          <View style={bc.rescueBtn}>
            <Text style={bc.rescueTxt}>Rescue</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Home Screen ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [cat, setCat] = useState<string>('ALL');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'VEGAN'>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 means any
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'rating_desc' | 'discount_desc'>('distance');

  const { user } = useAuthStore();
  const { location } = useLocationStore();
  const { setTabBarVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY > 80) {
      if (diff > 6) {
        // User scrolls down (content moves up) -> Hide navigation
        setTabBarVisible(false);
      } else if (diff < -6) {
        // User scrolls up (content moves down) -> Show navigation
        setTabBarVisible(true);
      }
    } else {
      // Near top of page -> Always visible
      setTabBarVisible(true);
    }

    lastScrollY.current = currentY;
  };

  const {
    data: bagsRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['bags', cat, location?.latitude, location?.longitude],
    queryFn: () =>
      bagService.discover({
        category: cat === 'ALL' ? undefined : (cat as any),
        lat: location?.latitude,
        lng: location?.longitude,
        radius: 15,
        sort: 'distance' as const,
      }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const rawBags = bagsRes?.data?.bags ?? bagsRes?.data?.data ?? [];

  // Apply active client filters
  const bags = useMemo(() => {
    let result = [...rawBags];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.partner?.businessName?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }

    if (dietaryFilter !== 'ALL') {
      result = result.filter((b) => b.dietaryType === dietaryFilter);
    }

    if (maxPrice > 0) {
      result = result.filter((b) => b.sellingPrice <= maxPrice);
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'rating_desc') {
      result.sort((a, b) => (b.partner?.rating || 0) - (a.partner?.rating || 0));
    } else if (sortBy === 'discount_desc') {
      result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortBy === 'distance') {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return result;
  }, [rawBags, dietaryFilter, maxPrice, sortBy]);

  const hasActiveFilters = dietaryFilter !== 'ALL' || maxPrice > 0 || sortBy !== 'distance';

  const resetFilters = () => {
    setDietaryFilter('ALL');
    setMaxPrice(0);
    setSortBy('distance');
    setIsFilterModalOpen(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Scroll Interpolations for Sticky Fixed Header & Search Bar ──────────────
  const headerBgColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['rgba(0, 0, 0, 0)', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  const headerBorderColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['rgba(0, 0, 0, 0)', '#EEEEF0'],
    extrapolate: 'clamp',
  });

  const searchBgColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['rgba(255, 255, 255, 0.22)', '#F2F2F7'],
    extrapolate: 'clamp',
  });

  const searchBorderColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['rgba(255, 255, 255, 0.65)', '#E5E5EA'],
    extrapolate: 'clamp',
  });

  const searchTextColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['#FFFFFF', '#1C1C1E'],
    extrapolate: 'clamp',
  });

  const locationTextColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['#FFFFFF', '#1C1C1E'],
    extrapolate: 'clamp',
  });

  const locationSubColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['rgba(255, 255, 255, 0.85)', '#8E8E93'],
    extrapolate: 'clamp',
  });

  const iconColor = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: ['#FFFFFF', '#1C1C1E'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── STICKY FIXED HEADER (Location + Liked Heart + Search Bar + Filter) ── */}
      <Animated.View
        style={[
          s.fixedHeaderWrapper,
          {
            backgroundColor: headerBgColor,
            borderBottomColor: headerBorderColor,
          },
        ]}
      >
        <SafeAreaView edges={['top']} style={s.fixedHeaderSafe}>
          {/* Top Bar: Location & Liked */}
          <View style={s.topBarRow}>
            <TouchableOpacity
              style={s.locationBox}
              onPress={() => router.push('/(auth)/location')}
              activeOpacity={0.85}
            >
              <View style={s.locTitleRow}>
                <Ionicons name="location-sharp" size={18} color="#1B5E20" />
                <Animated.Text style={[s.locText, { color: locationTextColor }]} numberOfLines={1}>
                  {location?.address || location?.city || 'Select Exact Location'}
                </Animated.Text>
                <Animated.View>
                  <Ionicons name="chevron-down" size={15} color="#1B5E20" />
                </Animated.View>
              </View>
              <Animated.Text style={[s.greetingText, { color: locationSubColor }]}>
                {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Animated.Text>
            </TouchableOpacity>

            {/* Liked (Heart) Button with Red Background */}
            <TouchableOpacity
              style={s.topLikedBtn}
              onPress={() => router.push('/favorites' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Fixed Sticky Interactive Search Bar with Filter */}
          <View style={s.searchBarWrapper}>
            <View style={s.searchBarContainer}>
              <Animated.View
                style={[
                  s.searchBarAnimatedInner,
                  {
                    backgroundColor: searchBgColor,
                    borderColor: searchBorderColor,
                  },
                ]}
              >
                <Ionicons name="search" size={19} color="#1C1C1E" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Restaurant, bakery, or surprise bag..."
                  placeholderTextColor="#7C7C80"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>

            <TouchableOpacity
              style={s.filterBtnContainer}
              onPress={() => setIsFilterModalOpen(true)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  s.filterBtnAnimatedInner,
                  hasActiveFilters && s.filterBtnActive,
                  {
                    backgroundColor: hasActiveFilters ? '#1B5E20' : searchBgColor,
                    borderColor: hasActiveFilters ? '#1B5E20' : searchBorderColor,
                  },
                ]}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={hasActiveFilters ? '#FFFFFF' : '#1C1C1E'}
                />
                {hasActiveFilters && <View style={s.filterBadgeDot} />}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── 1. FIXED TOP HERO CAROUSEL (Locked at top, does not scroll down) ── */}
      <View style={s.fixedHeroContainer} pointerEvents="box-none">
        <FlatList
          data={HERO_BANNERS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveBannerIdx(idx);
          }}
          renderItem={({ item }) => (
            <View style={s.carouselSlide}>
              <Image source={{ uri: item.image }} style={s.slideImage} resizeMode="cover" />
              <LinearGradient
                colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
                style={s.slideGradient}
              />
            </View>
          )}
        />

        {/* Banner Promotional Text & Pricing */}
        <View style={s.bannerOverlayPromoBox} pointerEvents="none">
          <View style={s.bannerTagBadge}>
            <Text style={s.bannerTagTxt}>{HERO_BANNERS[activeBannerIdx]?.tag}</Text>
          </View>
          <Text style={s.bannerTitle}>{HERO_BANNERS[activeBannerIdx]?.title}</Text>
          <Text style={s.bannerSubtitle} numberOfLines={1}>
            {HERO_BANNERS[activeBannerIdx]?.subtitle}
          </Text>

          {/* Carousel Pagination Dots */}
          <View style={s.dotsContainer}>
            {HERO_BANNERS.map((_, i) => (
              <View
                key={i}
                style={[s.dotIndicator, i === activeBannerIdx && s.dotIndicatorActive]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── 2. SCROLLABLE SCREEN CONTENT (Glides smoothly over fixed hero) ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: handleScroll,
          }
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Spacer to show fixed hero behind */}
        <View style={{ height: CAROUSEL_HEIGHT - 36 }} pointerEvents="none" />

        {/* Rounded Content Sheet */}
        <View style={s.contentSheet}>
          {/* Category Pills (Green Active State) */}
          <View style={s.catsWrap}>
            <FlatList
              data={CATS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i) => i.id}
              contentContainerStyle={s.catsList}
              renderItem={({ item }) => {
                const active = item.id === cat;
                return (
                  <TouchableOpacity
                    style={[s.catPill, active && s.catPillActive]}
                    onPress={() => setCat(item.id)}
                    activeOpacity={0.8}
                  >
                    {item.lib === 'ion' ? (
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={active ? '#FFFFFF' : '#3A3A3C'}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={16}
                        color={active ? '#FFFFFF' : '#3A3A3C'}
                      />
                    )}
                    <Text style={[s.catTxt, active && s.catTxtActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Section Header */}
          <View style={s.secHeader}>
            <View>
              <Text style={s.secTitle}>
                {location?.city ? `Surprise Bags near ${location.city}` : 'Nearby Surprise Bags'}
              </Text>
              <Text style={s.secSub}>
                {hasActiveFilters
                  ? `Showing ${bags.length} filtered meals`
                  : 'Fresh unsold meals available for pickup today'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/map' as any)}>
              <Text style={s.seeAll}>View Map</Text>
            </TouchableOpacity>
          </View>

          {/* Bags List / Shimmering Skeleton Loader */}
          {isLoading ? (
            <View style={s.skeletonWrap}>
              <BagCardSkeleton />
              <BagCardSkeleton />
              <BagCardSkeleton />
            </View>
          ) : bags.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <MaterialCommunityIcons name="shopping-outline" size={44} color="#1B5E20" />
              </View>
              <Text style={s.emptyTitle}>No matching surprise bags</Text>
              <Text style={s.emptySub}>
                {hasActiveFilters
                  ? 'Try resetting your dietary or price filters.'
                  : 'Check back soon or explore another area.'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={resetFilters} style={s.resetEmptyBtn}>
                  <Text style={s.resetEmptyTxt}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={s.bagsList}>
              {bags.map((bag: any) => (
                <BagCard key={bag.id} bag={bag} onPress={() => router.push(`/(consumer)/bags/${bag.id}`)} />
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </View>
      </Animated.ScrollView>

      {/* ── FILTER BOTTOM SHEET MODAL ── */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.filterModalContent}>
            {/* Modal Header */}
            <View style={s.filterHeader}>
              <Text style={s.filterTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} style={s.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Dietary Filter */}
              <Text style={s.filterSectionTitle}>DIETARY PREFERENCE</Text>
              <View style={s.optionsRow}>
                {[
                  { label: 'All', val: 'ALL' },
                  { label: 'Pure Veg', val: 'VEG' },
                  { label: 'Non-Veg', val: 'NON_VEG' },
                  { label: 'Vegan', val: 'VEGAN' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.val}
                    style={[s.filterChip, dietaryFilter === opt.val && s.filterChipActive]}
                    onPress={() => setDietaryFilter(opt.val as any)}
                  >
                    <Text style={[s.filterChipTxt, dietaryFilter === opt.val && s.filterChipTxtActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Filter */}
              <Text style={s.filterSectionTitle}>MAXIMUM PRICE</Text>
              <View style={s.optionsRow}>
                {[
                  { label: 'Any Price', val: 0 },
                  { label: 'Under ₹99', val: 99 },
                  { label: 'Under ₹149', val: 149 },
                  { label: 'Under ₹199', val: 199 },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.val}
                    style={[s.filterChip, maxPrice === opt.val && s.filterChipActive]}
                    onPress={() => setMaxPrice(opt.val)}
                  >
                    <Text style={[s.filterChipTxt, maxPrice === opt.val && s.filterChipTxtActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort Order */}
              <Text style={s.filterSectionTitle}>SORT BY</Text>
              <View style={s.sortList}>
                {[
                  { label: 'Distance: Nearest First', val: 'distance' },
                  { label: 'Price: Low to High', val: 'price_asc' },
                  { label: 'Highest Rated Stores', val: 'rating_desc' },
                  { label: 'Biggest Discount %', val: 'discount_desc' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.val}
                    style={s.sortRow}
                    onPress={() => setSortBy(opt.val as any)}
                  >
                    <Text style={[s.sortRowTxt, sortBy === opt.val && s.sortRowTxtActive]}>
                      {opt.label}
                    </Text>
                    <Ionicons
                      name={sortBy === opt.val ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={sortBy === opt.val ? '#1B5E20' : '#C7C7CC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={s.modalActionsRow}>
              <TouchableOpacity style={s.resetBtn} onPress={resetFilters}>
                <Text style={s.resetBtnTxt}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.applyBtn}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={s.applyBtnTxt}>Apply Filters ({bags.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  fixedHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  fixedHeaderSafe: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    marginBottom: 8,
  },
  locationBox: { flex: 1 },
  locTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: {
    fontFamily: Font.extraBold,
    fontSize: 16,
    maxWidth: '80%',
  },
  greetingText: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 1,
  },
  topLikedBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F',
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBarAnimatedInner: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  searchInput: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#101214',
    flex: 1,
    paddingVertical: 0,
  },
  filterBtnContainer: {
    width: 48,
    height: 48,
  },
  filterBtnAnimatedInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
  },
  filterBtnActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF6D00',
  },
  fixedHeroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: CAROUSEL_HEIGHT,
    zIndex: 0,
    backgroundColor: '#1C1C1E',
  },
  contentSheet: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    marginTop: -8,
    minHeight: 600,
  },
  heroCarouselContainer: {
    width: width,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
    backgroundColor: '#1C1C1E',
  },
  carouselSlide: { width: width, height: CAROUSEL_HEIGHT, position: 'relative' },
  slideImage: { width: '100%', height: '100%' },
  slideGradient: { ...StyleSheet.absoluteFillObject },
  bannerOverlayPromoBox: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  bannerTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  bannerTagTxt: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontFamily: Font.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  catsWrap: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    overflow: 'hidden',
  },
  catsList: { paddingHorizontal: 10, gap: 8 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  catPillActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  catTxt: { fontFamily: Font.medium, fontSize: 12, color: '#3A3A3C' },
  catTxtActive: { color: '#FFFFFF', fontFamily: Font.bold },
  secHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  secTitle: { fontFamily: Font.extraBold, fontSize: 16, color: '#1C1C1E' },
  secSub: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93', marginTop: 1 },
  seeAll: { fontFamily: Font.bold, fontSize: 12, color: '#1B5E20' },
  bagsList: { paddingHorizontal: 16 },
  skeletonWrap: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: Font.bold, fontSize: 15, color: '#1C1C1E', marginBottom: 4 },
  emptySub: { fontFamily: Font.regular, fontSize: 12, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  resetEmptyBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  resetEmptyTxt: { fontFamily: Font.bold, fontSize: 12, color: '#1B5E20' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTitle: { fontFamily: Font.extraBold, fontSize: 18, color: '#1C1C1E' },
  modalCloseBtn: { padding: 4 },
  filterSectionTitle: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterChipTxt: { fontFamily: Font.medium, fontSize: 12, color: '#1C1C1E' },
  filterChipTxtActive: { color: '#FFFFFF', fontFamily: Font.bold },
  sortList: {
    gap: 10,
    marginBottom: 10,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  sortRowTxt: { fontFamily: Font.medium, fontSize: 13, color: '#1C1C1E' },
  sortRowTxtActive: { fontFamily: Font.bold, color: '#1B5E20' },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  resetBtnTxt: { fontFamily: Font.bold, fontSize: 13, color: '#1C1C1E' },
  applyBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyBtnTxt: { fontFamily: Font.bold, fontSize: 13, color: '#FFFFFF' },
});

const bc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 14,
    ...Elevation.card,
  },
  imgBox: { height: 140, backgroundColor: '#F5F5F7', position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9' },
  discBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discTxt: { fontFamily: Font.bold, fontSize: 10, color: '#FFFFFF' },
  lowBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowTxt: { fontFamily: Font.medium, fontSize: 10, color: '#FFFFFF' },
  info: { padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  restaurant: { fontFamily: Font.bold, fontSize: 14, color: '#1C1C1E', flex: 1 },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distance: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93' },
  bagName: { fontFamily: Font.medium, fontSize: 12, color: '#636366', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontFamily: Font.bold, fontSize: 12, color: '#1C1C1E' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#C7C7CC' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pickupTxt: { fontFamily: Font.regular, fontSize: 11, color: '#636366' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prices: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sellingPrice: { fontFamily: Font.extraBold, fontSize: 18, color: '#1C1C1E' },
  origPrice: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  rescueBtn: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rescueTxt: { fontFamily: Font.bold, fontSize: 12, color: '#FFFFFF' },
});
