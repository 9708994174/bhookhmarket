import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Callout, Marker } from 'react-native-maps';
import { Font, Elevation } from '../../../constants/theme';
import { useLocationStore } from '../../../store';
import { bagService } from '../../../services';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { location } = useLocationStore();
  const [selectedBag, setSelectedBag] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const params = {
    lat: location?.latitude || 12.9716,
    lng: location?.longitude || 77.5946,
    radius: 15,
    limit: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['bags-map', params],
    queryFn: () => bagService.discover(params),
  });

  const allBags = data?.data?.bags ?? data?.data?.data ?? [];

  // Operational real-time search filtering
  const filteredBags = searchQuery.trim()
    ? allBags.filter(
        (b: any) =>
          b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.partner?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.partner?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBags;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={s.mapCanvas}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: params.lat,
            longitude: params.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation={Boolean(location)}
          showsMyLocationButton
          toolbarEnabled={false}
        >
          {filteredBags.map((bag: any, idx: number) => {
            const latitude = Number(bag.partner?.latitude);
            const longitude = Number(bag.partner?.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            const isSelected = selectedBag?.id === bag.id;
            return (
              <Marker
                key={bag.id || idx}
                coordinate={{ latitude, longitude }}
                onPress={() => setSelectedBag(bag)}
                pinColor={isSelected ? '#FF5A5F' : '#1B5E20'}
              >
                <Callout>
                  <View style={s.callout}>
                    <Text style={s.calloutTitle}>{bag.partner?.businessName || 'Local Partner'}</Text>
                    <Text style={s.calloutPrice}>₹{bag.sellingPrice} · {bag.title}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* ── Top Header with Standalone Separated Back Button & Operational Search Box ── */}
        <SafeAreaView edges={['top']} style={s.mapHeader}>
          {/* Top Bar with Back button on its own row */}
          <View style={s.navRow}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)'))}
              style={s.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={s.androidGlassBg} />
              )}
              <View style={s.glassOverlay} />
              <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>

            <View style={s.locationChip}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={s.androidGlassBg} />
              )}
              <View style={s.glassOverlay} />
              <View style={s.chipInner}>
                <Ionicons name="location-sharp" size={14} color="#1B5E20" />
                <Text style={s.locationChipTxt} numberOfLines={1}>
                  {location?.city || 'Bengaluru'}
                </Text>
              </View>
            </View>
          </View>

          {/* Standalone Operational Liquid Glass Search Bar */}
          <View style={s.searchBar}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={s.androidGlassBg} />
            )}
            <View style={s.glassOverlay} />

            <View style={s.searchInnerRow}>
              <Ionicons name="search" size={19} color="#1C1C1E" />
              <TextInput
                style={s.searchInput}
                placeholder="Search area, bakery, restaurant..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              ) : (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeTxt}>{filteredBags.length} bags</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>

        {/* ── Bottom Selected Bag Floating Preview Card ── */}
        {selectedBag ? (
          <View style={s.selectedCardContainer}>
            <TouchableOpacity
              style={s.card}
              onPress={() => router.push(`/(consumer)/bags/${selectedBag.id}`)}
              activeOpacity={0.9}
            >
              <View style={s.cardImgBox}>
                {selectedBag.imageUrl ? (
                  <Image source={{ uri: selectedBag.imageUrl }} style={s.cardImg} resizeMode="cover" />
                ) : (
                  <View style={s.cardImgPlaceholder}>
                    <MaterialCommunityIcons name="shopping" size={32} color="#1B5E20" />
                  </View>
                )}
                <View style={s.cardDisc}>
                  <Text style={s.cardDiscTxt}>{selectedBag.discountPercent || 65}% OFF</Text>
                </View>
              </View>

              <View style={s.cardDetails}>
                <View style={s.cardTopRow}>
                  <Text style={s.cardStore} numberOfLines={1}>
                    {selectedBag.partner?.businessName || 'Bakery & Cafe'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedBag(null)} style={s.cardCloseBtn}>
                    <Ionicons name="close" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <Text style={s.cardTitle} numberOfLines={1}>
                  {selectedBag.title}
                </Text>

                <View style={s.cardMetaRow}>
                  <View style={s.starBadge}>
                    <Ionicons name="star" size={11} color="#FFB300" />
                    <Text style={s.starTxt}>{selectedBag.partner?.rating?.toFixed(1) || '4.8'}</Text>
                  </View>
                  <Text style={s.distTxt}>{selectedBag.distance || 1.2} km away</Text>
                </View>

                <View style={s.cardBottomRow}>
                  <View style={s.priceBox}>
                    <Text style={s.cardPrice}>₹{selectedBag.sellingPrice}</Text>
                    <Text style={s.cardOrigPrice}>₹{selectedBag.originalValue}</Text>
                  </View>
                  <View style={s.viewBagBtn}>
                    <Text style={s.viewBagTxt}>View Bag</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F5E9' },
  mapCanvas: { flex: 1, position: 'relative' },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F2F7F2',
    opacity: 0.8,
  },
  callout: {
    minWidth: 150,
    maxWidth: 230,
    padding: 6,
  },
  calloutTitle: { fontWeight: '700', color: '#1C1C1E', marginBottom: 3 },
  calloutPrice: { color: '#636366', fontSize: 12 },
  mapHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 100,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Elevation.md,
  },
  locationChip: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Elevation.md,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationChipTxt: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#1C1C1E',
    maxWidth: 160,
  },
  searchBar: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    overflow: 'hidden',
    position: 'relative',
    ...Elevation.md,
  },
  androidGlassBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  searchInnerRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#1C1C1E',
  },
  countBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#1B5E20',
  },
  pinsLayer: {
    ...StyleSheet.absoluteFill,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  pinSelected: {
    zIndex: 50,
  },
  pinBubble: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  pinBubbleActive: {
    backgroundColor: '#FF6D00',
    transform: [{ scale: 1.15 }],
  },
  pinPrice: {
    fontFamily: Font.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  pinPriceActive: {
    color: '#FFFFFF',
  },
  pinPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B5E20',
    marginTop: 2,
  },
  pinPointActive: {
    backgroundColor: '#FF6D00',
  },
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1B5E20',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -7 }, { translateY: -7 }],
  },
  selectedCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    ...Elevation.lg,
  },
  cardImgBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F7',
  },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardDisc: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardDiscTxt: { fontFamily: Font.bold, fontSize: 8, color: '#FFFFFF' },
  cardDetails: { flex: 1, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardStore: { fontFamily: Font.bold, fontSize: 13, color: '#1C1C1E', flex: 1 },
  cardCloseBtn: { padding: 2 },
  cardTitle: { fontFamily: Font.medium, fontSize: 12, color: '#636366' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  starTxt: { fontFamily: Font.bold, fontSize: 10, color: '#FFB300' },
  distTxt: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceBox: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  cardPrice: { fontFamily: Font.extraBold, fontSize: 15, color: '#1B5E20' },
  cardOrigPrice: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  viewBagBtn: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBagTxt: { fontFamily: Font.bold, fontSize: 11, color: '#FFFFFF' },
});
