import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  Platform,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Callout, Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Font, Elevation } from '../../../constants/theme';
import { useLocationStore } from '../../../store';
import { bagService } from '../../../services';

const { width } = Dimensions.get('window');

// ─── Haversine distance (km) ───────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ─── ETA computation (client-side, free) ──────────────────────────────────
function computeEta(distKm: number) {
  const walkMin = Math.ceil((distKm / 5) * 60);
  const bikeMin = Math.ceil((distKm / 20) * 60);
  const carMin = Math.ceil((distKm / 30) * 60);
  return { walkMin, bikeMin, carMin };
}

// ─── Open native maps with directions ────────────────────────────────────
function openNavigation(lat: number, lng: number, label: string) {
  const encoded = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://0,0?daddr=${lat},${lng}&q=${encoded}`,
    android: `google.navigation:q=${lat},${lng}`,
  });
  if (!url) return;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to browser google maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  });
}

// ─── ETA Pill ──────────────────────────────────────────────────────────────
function EtaPill({
  icon,
  label,
  time,
}: {
  icon: string;
  label: string;
  time: number;
}) {
  return (
    <View style={et.pill}>
      <Text style={et.pillIcon}>{icon}</Text>
      <Text style={et.pillTime}>{time} min</Text>
      <Text style={et.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Map Screen ───────────────────────────────────────────────────────
export default function MapScreen() {
  const { location } = useLocationStore();
  const [selectedBag, setSelectedBag] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCoord, setLiveCoord] = useState<{ latitude: number; longitude: number } | null>(
    location ? { latitude: location.latitude, longitude: location.longitude } : null
  );
  const mapRef = useRef<MapView>(null);
  const searchPulse = useRef(new Animated.Value(1)).current;

  // Live location watch
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (pos) => {
          const coord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLiveCoord(coord);
          mapRef.current?.animateToRegion(
            { ...coord, latitudeDelta: 0.05, longitudeDelta: 0.05 },
            800
          );
        }
      );
    })();
    return () => {
      sub?.remove();
    };
  }, []);

  // Subtle search bar pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulse, { toValue: 1.015, duration: 900, useNativeDriver: true }),
        Animated.timing(searchPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const centerLat = liveCoord?.latitude ?? location?.latitude ?? 12.9716;
  const centerLng = liveCoord?.longitude ?? location?.longitude ?? 77.5946;

  const params = {
    lat: centerLat,
    lng: centerLng,
    radius: 15,
    limit: 40,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['bags-map', params.lat, params.lng],
    queryFn: () => bagService.discover(params),
    staleTime: 60_000,
  });

  const allBags = data?.data?.bags ?? data?.data?.data ?? [];

  const filteredBags = searchQuery.trim()
    ? allBags.filter(
        (b: any) =>
          b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.partner?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.partner?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBags;

  // Compute ETA for selected bag
  const selectedEta = selectedBag
    ? (() => {
        const lat2 = Number(selectedBag.partner?.latitude);
        const lng2 = Number(selectedBag.partner?.longitude);
        if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
        const dist = haversine(centerLat, centerLng, lat2, lng2);
        return { dist, ...computeEta(dist) };
      })()
    : null;

  const onMarkerPress = useCallback((bag: any) => {
    setSelectedBag(bag);
    const lat2 = Number(bag.partner?.latitude);
    const lng2 = Number(bag.partner?.longitude);
    if (Number.isFinite(lat2) && Number.isFinite(lng2)) {
      mapRef.current?.animateToRegion(
        { latitude: lat2, longitude: lng2, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        600
      );
    }
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={s.mapCanvas}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          toolbarEnabled={false}
        >
          {/* Route polyline: user → selected bag */}
          {selectedBag && liveCoord && (() => {
            const lat2 = Number(selectedBag.partner?.latitude);
            const lng2 = Number(selectedBag.partner?.longitude);
            if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
            return (
              <Polyline
                coordinates={[
                  { latitude: liveCoord.latitude, longitude: liveCoord.longitude },
                  { latitude: lat2, longitude: lng2 },
                ]}
                strokeColor="#1B5E20"
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            );
          })()}

          {/* Shop markers */}
          {filteredBags.map((bag: any, idx: number) => {
            const latitude = Number(bag.partner?.latitude);
            const longitude = Number(bag.partner?.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            const isSelected = selectedBag?.id === bag.id;
            return (
              <Marker
                key={bag.id || idx}
                coordinate={{ latitude, longitude }}
                onPress={() => onMarkerPress(bag)}
                tracksViewChanges={false}
              >
                {/* Custom price bubble marker */}
                <View style={[s.pinBubble, isSelected && s.pinBubbleActive]}>
                  <Text style={[s.pinPrice, isSelected && s.pinPriceActive]}>
                    ₹{bag.sellingPrice}
                  </Text>
                </View>
                <View style={[s.pinPoint, isSelected && s.pinPointActive]} />
                <Callout tooltip>
                  <View style={s.callout}>
                    <Text style={s.calloutTitle}>
                      {bag.partner?.businessName || 'Local Partner'}
                    </Text>
                    <Text style={s.calloutPrice}>
                      ₹{bag.sellingPrice} · {bag.title}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* ── Top Header ── */}
        <SafeAreaView edges={['top']} style={s.mapHeader}>
          <View style={s.navRow}>
            <TouchableOpacity
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)')
              }
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
                {isLoading ? (
                  <Text style={s.chipBadge}>...</Text>
                ) : (
                  <View style={s.chipCountBadge}>
                    <Text style={s.chipCountTxt}>{filteredBags.length} shops</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Auto-resize search bar */}
          <Animated.View style={[s.searchBar, { transform: [{ scale: searchPulse }] }]}>
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
                placeholder="Search area, bakery or shop name..."
                placeholderTextColor="#1C1C1E"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
        </SafeAreaView>

        {/* My Location FAB */}
        <TouchableOpacity
          style={s.myLocFab}
          onPress={() => {
            if (liveCoord) {
              mapRef.current?.animateToRegion(
                { ...liveCoord, latitudeDelta: 0.04, longitudeDelta: 0.04 },
                600
              );
            }
          }}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[s.androidGlassBg, { borderRadius: 22 }]} />
          )}
          <Ionicons name="locate" size={22} color="#1B5E20" />
        </TouchableOpacity>

        {/* ── Bottom Selected Bag Card with Zomato-style ETA ── */}
        {selectedBag ? (
          <View style={s.selectedCardContainer}>
            {/* ETA Row */}
            {selectedEta && (
              <View style={s.etaRow}>
                <EtaPill icon="🚶" label="Walk" time={selectedEta.walkMin} />
                <EtaPill icon="🛵" label="Bike" time={selectedEta.bikeMin} />
                <EtaPill icon="🚗" label="Drive" time={selectedEta.carMin} />
                <View style={et.distPill}>
                  <Text style={et.distKm}>{selectedEta.dist} km</Text>
                  <Text style={et.distLabel}>away</Text>
                </View>
              </View>
            )}

            {/* Card */}
            <View style={s.card}>
              <TouchableOpacity
                style={s.cardBody}
                onPress={() => router.push(`/(consumer)/bags/${selectedBag.id}`)}
                activeOpacity={0.9}
              >
                <View style={s.cardImgBox}>
                  {selectedBag.imageUrl ? (
                    <Image
                      source={{ uri: selectedBag.imageUrl }}
                      style={s.cardImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={s.cardImgPlaceholder}>
                      <MaterialCommunityIcons name="shopping" size={32} color="#1B5E20" />
                    </View>
                  )}
                  <View style={s.cardDisc}>
                    <Text style={s.cardDiscTxt}>
                      {selectedBag.discountPercent || 65}% OFF
                    </Text>
                  </View>
                </View>

                <View style={s.cardDetails}>
                  <View style={s.cardTopRow}>
                    <Text style={s.cardStore} numberOfLines={1}>
                      {selectedBag.partner?.businessName || 'Bakery & Cafe'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedBag(null)}
                      style={s.cardCloseBtn}
                    >
                      <Ionicons name="close" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.cardTitle} numberOfLines={1}>
                    {selectedBag.title}
                  </Text>

                  <View style={s.cardMetaRow}>
                    <View style={s.starBadge}>
                      <Ionicons name="star" size={11} color="#FFB300" />
                      <Text style={s.starTxt}>
                        {selectedBag.partner?.rating?.toFixed(1) || '4.8'}
                      </Text>
                    </View>
                    <Text style={s.distTxt}>
                      {selectedEta ? `${selectedEta.dist} km` : '—'}
                    </Text>
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

              {/* Navigate button */}
              <TouchableOpacity
                style={s.navigateBtn}
                onPress={() => {
                  const lat2 = Number(selectedBag.partner?.latitude);
                  const lng2 = Number(selectedBag.partner?.longitude);
                  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) {
                    Alert.alert('Location unavailable', 'This shop has no map location set.');
                    return;
                  }
                  openNavigation(lat2, lng2, selectedBag.partner?.businessName || 'BhookhMarket Shop');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={s.navigateTxt}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── ETA pill styles ───────────────────────────────────────────────────────
const et = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    borderRadius: 10,
    paddingVertical: 7,
    gap: 1,
  },
  pillIcon: { fontSize: 16 },
  pillTime: { fontFamily: Font.bold, fontSize: 13, color: '#1B5E20' },
  pillLabel: { fontFamily: Font.regular, fontSize: 9, color: '#8E8E93' },
  distPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 7,
  },
  distKm: { fontFamily: Font.extraBold, fontSize: 13, color: '#1B5E20' },
  distLabel: { fontFamily: Font.regular, fontSize: 9, color: '#8E8E93' },
});

// ─── Main styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F5E9' },
  mapCanvas: { flex: 1, position: 'relative' },
  callout: {
    minWidth: 150,
    maxWidth: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    ...Elevation.sm,
  },
  calloutTitle: { fontFamily: Font.bold, fontSize: 13, color: '#1C1C1E', marginBottom: 3 },
  calloutPrice: { fontFamily: Font.regular, fontSize: 11, color: '#636366' },
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
    flex: 1,
    marginLeft: 12,
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
    flex: 1,
  },
  chipBadge: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93' },
  chipCountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chipCountTxt: { fontFamily: Font.bold, fontSize: 10, color: '#1B5E20' },
  searchBar: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#1C1C1E',
    padding: 0,
  },
  myLocFab: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Elevation.md,
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
  pinPriceActive: { color: '#FFFFFF' },
  pinPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B5E20',
    marginTop: 2,
    alignSelf: 'center',
  },
  pinPointActive: { backgroundColor: '#FF6D00' },
  selectedCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
    gap: 8,
  },
  etaRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    ...Elevation.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    ...Elevation.lg,
  },
  cardBody: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
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
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1565C0',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 11,
  },
  navigateTxt: { fontFamily: Font.bold, fontSize: 13, color: '#FFFFFF' },
});
