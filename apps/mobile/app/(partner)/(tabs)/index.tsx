import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { useAuthStore, useUIStore } from '../../../store';
import { partnerService, bagService, orderService } from '../../../services';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 380;

const PARTNER_BANNERS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    tag: 'STORE OPEN FOR ORDERS',
    title: 'The Artisan Bakery & Cafe',
    subtitle: 'Surplus pickup window: 6:00 PM – 9:30 PM',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    tag: 'TODAYS SURPLUS SPOTLIGHT',
    title: 'Evening Pastry & Croissant Box',
    subtitle: '8 bags rescued today · ₹929 net revenue',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&auto=format&fit=crop&q=80',
    tag: 'FSSAI HYGIENE VERIFIED',
    title: 'Zero Waste Kitchen Mission',
    subtitle: '100% freshly baked daily surplus',
  },
];

const CATS = [
  { id: 'ALL', label: 'All Bags', icon: 'grid-outline', lib: 'ion' },
  { id: 'BAKERY', label: 'Bakery & Pastries', icon: 'baguette', lib: 'mci' },
  { id: 'CAFE', label: 'Cafe Bites', icon: 'coffee-outline', lib: 'mci' },
  { id: 'LIVE', label: 'Live for Pickup', icon: 'time-outline', lib: 'ion' },
  { id: 'LOW_STOCK', label: 'Low Stock (<3)', icon: 'flame-outline', lib: 'ion' },
];

export default function PartnerHomeScreen() {
  const { user } = useAuthStore();
  const { setTabBarVisible } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter options inside modal
  const [modalStockFilter, setModalStockFilter] = useState<'ALL' | 'IN_STOCK' | 'SOLD_OUT'>('ALL');
  const [modalSortBy, setModalSortBy] = useState<'NEWEST' | 'PRICE_LOW' | 'STOCK_LOW'>('NEWEST');

  const scrollY = useRef(new Animated.Value(0)).current;

  const partner = user?.partnerProfile;
  const partnerId = partner?.id ?? '';

  const { data: earningsData, refetch: refetchEarnings } = useQuery({
    queryKey: ['partner-earnings', partnerId],
    queryFn: () => partnerService.getEarnings(partnerId),
    enabled: Boolean(partnerId),
  });

  const { data: bagsData, refetch: refetchBags } = useQuery({
    queryKey: ['partner-bags'],
    queryFn: () => bagService.getMyBags(),
  });

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['partner-orders'],
    queryFn: () => orderService.getPartnerOrders(),
  });

  const earnings = earningsData?.data?.data;
  const bags = bagsData?.data?.data ?? [];
  const orders = ordersData?.data?.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEarnings(), refetchBags(), refetchOrders()]);
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Filter bags based on search query, category, and modal filters
  let filteredBags = bags.filter((bag: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      bag.title?.toLowerCase().includes(q) ||
      bag.category?.toLowerCase().includes(q) ||
      bag.description?.toLowerCase().includes(q);

    let matchCat = true;
    if (selectedCat === 'BAKERY') matchCat = bag.category === 'BAKERY';
    if (selectedCat === 'CAFE') matchCat = bag.category === 'CAFE';
    if (selectedCat === 'LIVE') matchCat = bag.remainingQuantity > 0;
    if (selectedCat === 'LOW_STOCK') matchCat = bag.remainingQuantity > 0 && bag.remainingQuantity <= 3;

    let matchStock = true;
    if (modalStockFilter === 'IN_STOCK') matchStock = bag.remainingQuantity > 0;
    if (modalStockFilter === 'SOLD_OUT') matchStock = bag.remainingQuantity === 0;

    return matchSearch && matchCat && matchStock;
  });

  if (modalSortBy === 'PRICE_LOW') {
    filteredBags = [...filteredBags].sort((a: any, b: any) => a.sellingPrice - b.sellingPrice);
  } else if (modalSortBy === 'STOCK_LOW') {
    filteredBags = [...filteredBags].sort((a: any, b: any) => a.remainingQuantity - b.remainingQuantity);
  }

  // Header scroll animations (Transparent to White on scroll)
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

  const hasActiveFilters = modalStockFilter !== 'ALL' || modalSortBy !== 'NEWEST';

  // Track scroll direction to show/hide bottom pill
  const lastScrollY = useRef(0);
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
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── STICKY FIXED HEADER (Location + Switch View + Search Bar + Filter Above Image) ── */}
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
          {/* Top Bar: Location & Switcher */}
          <View style={s.topBarRow}>
            <TouchableOpacity
              style={s.locationBox}
              onPress={() => router.push('/(partner)/(tabs)/profile' as any)}
              activeOpacity={0.85}
            >
              <View style={s.locTitleRow}>
                <Ionicons name="location-sharp" size={18} color="#1B5E20" />
                <Animated.Text style={[s.locText, { color: locationTextColor }]} numberOfLines={1}>
                  {partner?.address || '100ft Road, Indiranagar, Bengaluru'}
                </Animated.Text>
                <Animated.View>
                  <Ionicons name="chevron-down" size={15} color="#1B5E20" />
                </Animated.View>
              </View>
              <Animated.Text style={[s.greetingText, { color: locationSubColor }]}>
                {greeting}, {partner?.businessName || 'The Artisan Bakery'}
              </Animated.Text>
            </TouchableOpacity>

          </View>

          {/* Sticky Search Bar with Filter Button (Above Image) */}
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
                <Animated.View>
                  <Ionicons name="search" size={19} color="#1C1C1E" />
                </Animated.View>
                <TextInput
                  style={s.searchInput}
                  placeholder="Search bags, category, or pickup code..."
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

            {/* Filter Button */}
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
          data={PARTNER_BANNERS}
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

        {/* Banner Overlay Info & Quick Actions */}
        <View style={s.bannerOverlayPromoBox} pointerEvents="none">
          <View style={s.bannerTagBadge}>
            <View style={s.bannerLiveDot} />
            <Text style={s.bannerTagTxt}>{PARTNER_BANNERS[activeBannerIdx]?.tag}</Text>
          </View>
          <Text style={s.bannerTitle}>{PARTNER_BANNERS[activeBannerIdx]?.title}</Text>
          <Text style={s.bannerSubtitle} numberOfLines={1}>
            {PARTNER_BANNERS[activeBannerIdx]?.subtitle}
          </Text>

          {/* Pagination Dots */}
          <View style={s.dotsContainer}>
            {PARTNER_BANNERS.map((_, i) => (
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
        <View style={{ height: HERO_HEIGHT - 36 }} pointerEvents="none" />

        {/* Rounded Content Sheet */}
        <View style={s.contentSheet}>
          {/* Category Pills (Consumer Style) */}
          <View style={s.catsWrap}>
            <FlatList
              data={CATS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i) => i.id}
              contentContainerStyle={s.catsList}
            renderItem={({ item }) => {
              const active = item.id === selectedCat;
              return (
                <TouchableOpacity
                  style={[s.catPill, active && s.catPillActive]}
                  onPress={() => setSelectedCat(item.id)}
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

        {/* ── 3. Flat Modern Stat Metrics (Clean Cards) ── */}
        <View style={s.statsSection}>
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <View style={[s.statIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="bag-check" size={18} color="#1B5E20" />
              </View>
              <Text style={s.statVal}>{earnings?.today?.bagsSold ?? 8}</Text>
              <Text style={s.statLabel}>Bags Rescued</Text>
            </View>

            <View style={s.statCard}>
              <View style={[s.statIconWrap, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cash" size={18} color="#1565C0" />
              </View>
              <Text style={s.statVal}>₹{earnings?.today?.netAmount?.toFixed(0) ?? '929'}</Text>
              <Text style={s.statLabel}>Net Revenue</Text>
            </View>

            <View style={s.statCard}>
              <View style={[s.statIconWrap, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="star" size={18} color="#FFB300" />
              </View>
              <Text style={s.statVal}>{partner?.rating ? partner.rating.toFixed(1) : '4.9'}</Text>
              <Text style={s.statLabel}>Store Rating</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Quick Action Tiles ── */}
        <View style={s.quickActionsSection}>
          <View style={s.quickActionsRow}>
            <TouchableOpacity
              style={s.quickActionTile}
              onPress={() => router.push('/(partner)/bags/create' as any)}
              activeOpacity={0.8}
            >
              <View style={[s.quickActionIconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="add" size={22} color="#1B5E20" />
              </View>
              <Text style={s.quickActionTileTitle}>Post Bag</Text>
              <Text style={s.quickActionTileSub}>New surplus item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionTile}
              onPress={() => router.push('/(partner)/(tabs)/orders' as any)}
              activeOpacity={0.8}
            >
              <View style={[s.quickActionIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#1565C0" />
              </View>
              <Text style={s.quickActionTileTitle}>Verify Pickup</Text>
              <Text style={s.quickActionTileSub}>Scan code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionTile}
              onPress={() => router.push('/(partner)/(tabs)/bags' as any)}
              activeOpacity={0.8}
            >
              <View style={[s.quickActionIconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="layers-outline" size={20} color="#E65100" />
              </View>
              <Text style={s.quickActionTileTitle}>Inventory</Text>
              <Text style={s.quickActionTileSub}>{bags.length} live bags</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. Active Surplus Bags Feed with Meal Imagery ── */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Active Surplus Bags</Text>
              <Text style={s.sectionSub}>Available for today's pickup window</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(partner)/(tabs)/bags' as any)}>
              <Text style={s.viewAllBtn}>Manage ({filteredBags.length})</Text>
            </TouchableOpacity>
          </View>

          {filteredBags.length === 0 ? (
            <View style={s.emptyBagsBox}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80' }}
                style={s.emptyBagsImg}
              />
              <Text style={s.emptyBagsTitle}>No surplus bags found</Text>
              <Text style={s.emptyBagsSub}>Add a surprise bag to list your leftover food for customers.</Text>
              <TouchableOpacity
                style={s.createSurplusBtn}
                onPress={() => router.push('/(partner)/bags/create' as any)}
              >
                <Text style={s.createSurplusBtnTxt}>+ Post Surplus Bag</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.bagsList}>
              {filteredBags.map((bag: any) => {
                const discount = Math.round(((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100);
                const isLive = bag.remainingQuantity > 0;

                return (
                  <View key={bag.id} style={s.bagCard}>
                    <View style={s.bagCardTop}>
                      <Image
                        source={{ uri: bag.imageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80' }}
                        style={s.bagCardImg}
                      />
                      <View style={s.bagCardInfo}>
                        <Text style={s.bagCardTitle} numberOfLines={1}>{bag.title}</Text>
                        <Text style={s.bagCardCat}>{bag.category || 'Bakery & Pastry'}</Text>
                        <View style={s.bagCardPriceRow}>
                          <Text style={s.bagCardSellingPrice}>₹{bag.sellingPrice}</Text>
                          <Text style={s.bagCardOrigPrice}>₹{bag.originalValue}</Text>
                          <View style={s.bagCardDiscTag}>
                            <Text style={s.bagCardDiscTagTxt}>{discount}% OFF</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={s.bagCardBottom}>
                      <View style={s.scheduleBox}>
                        <Ionicons name="time-outline" size={14} color="#636366" />
                        <Text style={s.scheduleTxt}>
                          {new Date(bag.pickupStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(bag.pickupEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>

                      <View style={[s.stockPill, isLive ? s.stockPillLive : s.stockPillSold]}>
                        <Text style={[s.stockPillTxt, isLive ? s.stockPillTxtLive : s.stockPillTxtSold]}>
                          {isLive ? `${bag.remainingQuantity} in stock` : 'Sold Out'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── 6. Recent Pickups & Orders Feed ── */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Recent Customer Orders</Text>
              <Text style={s.sectionSub}>Orders pending pickup or completed</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(partner)/(tabs)/orders' as any)}>
              <Text style={s.viewAllBtn}>View All ({orders.length})</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <Text style={s.noOrdersTxt}>No orders received yet today.</Text>
          ) : (
            orders.slice(0, 2).map((order: any) => (
              <View key={order.id} style={s.orderCardRow}>
                <View style={s.orderCardLeft}>
                  <Text style={s.orderCardCode}>Pickup Code: #{order.pickupCode || '4821'}</Text>
                  <Text style={s.orderCardCust}>Customer: {order.user?.name || 'Local Customer'}</Text>
                  <Text style={s.orderCardBag} numberOfLines={1}>{order.bag?.title || 'Surprise Bag'}</Text>
                </View>
                <View style={s.orderCardRight}>
                  <Text style={s.orderCardAmt}>₹{order.totalAmount || 129}</Text>
                  <View style={s.orderCardStatus}>
                    <Text style={s.orderCardStatusTxt}>{order.status === 'COMPLETED' ? 'Picked Up' : 'Ready'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

          <View style={{ height: 110 }} />
        </View>
      </Animated.ScrollView>

      {/* ── Filter Modal ── */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filter Surplus Bags</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <Ionicons name="close" size={22} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Stock Availability */}
            <Text style={s.filterSecTitle}>Inventory Availability</Text>
            <View style={s.modalFilterRow}>
              {(['ALL', 'IN_STOCK', 'SOLD_OUT'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.modalFilterChip, modalStockFilter === opt && s.modalFilterChipActive]}
                  onPress={() => setModalStockFilter(opt)}
                >
                  <Text style={[s.modalFilterChipTxt, modalStockFilter === opt && s.modalFilterChipTxtActive]}>
                    {opt === 'ALL' ? 'All Stock' : opt === 'IN_STOCK' ? 'Live & In Stock' : 'Sold Out'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort By */}
            <Text style={s.filterSecTitle}>Sort By</Text>
            <View style={s.modalFilterRow}>
              {(['NEWEST', 'PRICE_LOW', 'STOCK_LOW'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.modalFilterChip, modalSortBy === opt && s.modalFilterChipActive]}
                  onPress={() => setModalSortBy(opt)}
                >
                  <Text style={[s.modalFilterChipTxt, modalSortBy === opt && s.modalFilterChipTxtActive]}>
                    {opt === 'NEWEST' ? 'Recently Added' : opt === 'PRICE_LOW' ? 'Price: Low to High' : 'Low Stock First'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.applyModalBtn} onPress={() => setIsFilterModalOpen(false)}>
              <Text style={s.applyModalBtnTxt}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
    paddingTop: Platform.OS === 'android' ? 28 : 4,
    paddingBottom: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationBox: {
    flex: 1,
    marginRight: 10,
  },
  locTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontFamily: Font.extraBold,
    fontSize: 15,
    flexShrink: 1,
  },
  greetingText: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 1,
  },
  topSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    ...Elevation.sm,
  },
  topSwitchTxt: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#1B5E20',
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
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#1C1C1E',
    height: '100%',
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
  },
  filterBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5A5F',
  },
  fixedHeroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: HERO_HEIGHT,
    zIndex: 0,
    backgroundColor: '#1C1C1E',
  },
  contentSheet: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    minHeight: 600,
  },
  heroCarouselContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#1C1C1E',
  },
  carouselSlide: {
    width: width,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlayPromoBox: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    gap: 4,
  },
  bannerTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  bannerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  bannerTagTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontFamily: Font.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  dotsContainer: {
    flexDirection: 'row',
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
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  catsWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  catsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  catPillActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  catTxt: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#3A3A3C',
  },
  catTxtActive: {
    color: '#FFFFFF',
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    alignItems: 'center',
    ...Elevation.card,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontFamily: Font.extraBold,
    fontSize: 17,
    color: '#1C1C1E',
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: 10.5,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    alignItems: 'center',
    ...Elevation.card,
  },
  quickActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionTileTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#1C1C1E',
  },
  quickActionTileSub: {
    fontFamily: Font.regular,
    fontSize: 10.5,
    color: '#8E8E93',
    marginTop: 1,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    ...Elevation.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: 15.5,
    color: '#1C1C1E',
  },
  sectionSub: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
    marginTop: 1,
  },
  viewAllBtn: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#1B5E20',
  },
  emptyBagsBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyBagsImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
  },
  emptyBagsTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#1C1C1E',
  },
  emptyBagsSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  createSurplusBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  createSurplusBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  bagsList: {
    gap: 10,
  },
  bagCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 8,
  },
  bagCardTop: {
    flexDirection: 'row',
    gap: 10,
  },
  bagCardImg: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  bagCardInfo: {
    flex: 1,
  },
  bagCardTitle: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1C1C1E',
  },
  bagCardCat: {
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: '#8E8E93',
    marginTop: 1,
  },
  bagCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  bagCardSellingPrice: {
    fontFamily: Font.extraBold,
    fontSize: 14.5,
    color: '#1B5E20',
  },
  bagCardOrigPrice: {
    fontFamily: Font.medium,
    fontSize: 11.5,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  bagCardDiscTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bagCardDiscTagTxt: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: '#1B5E20',
  },
  bagCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEF0',
  },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleTxt: {
    fontFamily: Font.medium,
    fontSize: 11.5,
    color: '#636366',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockPillLive: {
    backgroundColor: '#E8F5E9',
  },
  stockPillSold: {
    backgroundColor: '#FEE2E2',
  },
  stockPillTxt: {
    fontFamily: Font.bold,
    fontSize: 10.5,
  },
  stockPillTxtLive: {
    color: '#1B5E20',
  },
  stockPillTxtSold: {
    color: '#DC2626',
  },
  noOrdersTxt: {
    fontFamily: Font.regular,
    fontSize: 12.5,
    color: '#8E8E93',
    paddingVertical: 8,
  },
  orderCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginBottom: 8,
  },
  orderCardLeft: {
    flex: 1,
  },
  orderCardCode: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#1C1C1E',
  },
  orderCardCust: {
    fontFamily: Font.medium,
    fontSize: 11.5,
    color: '#636366',
    marginTop: 1,
  },
  orderCardBag: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  orderCardRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  orderCardAmt: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1B5E20',
  },
  orderCardStatus: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  orderCardStatusTxt: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: '#1B5E20',
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
    paddingBottom: 36,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: Font.extraBold,
    fontSize: 18,
    color: '#1C1C1E',
  },
  filterSecTitle: {
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: '#1C1C1E',
    marginTop: 4,
  },
  modalFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalFilterChipActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  modalFilterChipTxt: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#636366',
  },
  modalFilterChipTxtActive: {
    color: '#FFFFFF',
  },
  applyModalBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  applyModalBtnTxt: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
