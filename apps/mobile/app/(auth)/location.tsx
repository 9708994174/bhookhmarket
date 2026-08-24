import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Font, Elevation } from '../../constants/theme';
import { useLocationStore, useAuthStore } from '../../store';

const POPULAR_CITIES = [
  { name: 'Bengaluru',  state: 'Karnataka',     lat: 12.9716, lng: 77.5946, zones: 'Indiranagar, Koramangala, HSR Layout' },
  { name: 'Mumbai',     state: 'Maharashtra',   lat: 19.0760, lng: 72.8777, zones: 'Bandra, Andheri, Powai, Juhu' },
  { name: 'Delhi NCR',  state: 'Delhi',         lat: 28.7041, lng: 77.1025, zones: 'Connaught Place, Saket, Cyber City' },
  { name: 'Pune',       state: 'Maharashtra',   lat: 18.5204, lng: 73.8567, zones: 'Koregaon Park, Baner, Viman Nagar' },
  { name: 'Hyderabad',  state: 'Telangana',     lat: 17.3850, lng: 78.4867, zones: 'Gachibowli, Jubilee Hills, Madhapur' },
  { name: 'Chennai',    state: 'Tamil Nadu',    lat: 13.0827, lng: 80.2707, zones: 'T. Nagar, Adyar, Velachery' },
  { name: 'Kolkata',    state: 'West Bengal',   lat: 22.5726, lng: 88.3639, zones: 'Park Street, Salt Lake, New Town' },
  { name: 'Ahmedabad',  state: 'Gujarat',       lat: 23.0225, lng: 72.5714, zones: 'Bodakdev, Navrangpura, SG Highway' },
  { name: 'Jaipur',     state: 'Rajasthan',     lat: 26.9124, lng: 75.7873, zones: 'C-Scheme, Malviya Nagar, Vaishali Nagar' },
  { name: 'Lucknow',    state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, zones: 'Gomti Nagar, Hazratganj, Aliganj' },
  { name: 'Chandigarh', state: 'Punjab',        lat: 30.7333, lng: 76.7794, zones: 'Sector 17, Sector 35, Mohali' },
  { name: 'Indore',     state: 'Madhya Pradesh',lat: 22.7196, lng: 75.8577, zones: 'Vijay Nagar, Palasia, Bhawarkua' },
];

export default function LocationScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const selectedLocation = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPermission = useLocationStore((s) => s.setPermission);

  const currentCityName = selectedLocation?.city || 'Bengaluru';

  const filteredCities = query.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.state.toLowerCase().includes(query.toLowerCase()) ||
          c.zones.toLowerCase().includes(query.toLowerCase())
      )
    : POPULAR_CITIES;

  const onLocationConfirmed = () => {
    if (useAuthStore.getState().isAuthenticated) {
      if (useAuthStore.getState().user?.role === 'PARTNER') {
        router.replace('/(partner)/dashboard' as any);
      } else {
        router.replace('/(consumer)/(tabs)');
      }
    } else {
      router.replace('/(auth)/login' as any);
    }
  };

  const pickCity = (city: typeof POPULAR_CITIES[0]) => {
    setLocation({
      latitude: city.lat,
      longitude: city.lng,
      city: city.name,
      address: `${city.name}, ${city.state}`,
    });
    setIsCityDropdownOpen(false);
    onLocationConfirmed();
  };

  const useGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      setPermission(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const exactAddress = [
        geo.name,
        geo.streetNumber ? `${geo.streetNumber} ${geo.street}` : geo.street,
        geo.district || geo.subregion,
        geo.city,
      ]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(', ') || 'Current GPS Location';

      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city: geo.city ?? geo.region ?? 'Your Location',
        address: exactAddress,
      });
      onLocationConfirmed();
    } catch {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/onboarding');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Navigation Row: Back Button on its own line ── */}
      <View style={s.navBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* ── Header Title Row ── */}
      <View style={s.header}>
        <Text style={s.heading}>Select a location</Text>
        <Text style={s.subHeading}>Find surprise surplus bags and meals near you</Text>
      </View>

      {/* ── Standalone Separated Search Box ── */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={s.searchInput}
          placeholder="Search area, street name or city..."
          placeholderTextColor="#8E8E93"
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* ── Zomato-Style "Use Current Location" Card ── */}
        <TouchableOpacity style={s.gpsCard} onPress={useGPS} disabled={loading} activeOpacity={0.85}>
          <View style={s.gpsIconWrap}>
            {loading ? (
              <ActivityIndicator size="small" color="#1C1C1E" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#1C1C1E" />
            )}
          </View>
          <View style={s.gpsTextBox}>
            <Text style={s.gpsPrimary}>Use current location</Text>
            <Text style={s.gpsSub}>
              {loading ? 'Detecting your coordinates...' : 'Using GPS · Precise nearby surprise bags'}
            </Text>
          </View>
          <View style={s.enableTag}>
            <Text style={s.enableTagTxt}>Enable</Text>
          </View>
        </TouchableOpacity>

        <View style={s.divider} />

        {/* ── Zomato-Style City Dropdown Card ── */}
        <View style={s.dropdownContainer}>
          <TouchableOpacity
            style={s.cityDropdownTrigger}
            onPress={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            activeOpacity={0.8}
          >
            <View style={s.dropdownLeft}>
              <Ionicons name="business-outline" size={20} color="#1C1C1E" />
              <View>
                <Text style={s.dropdownLabel}>Selected City</Text>
                <Text style={s.dropdownCityName}>{currentCityName}</Text>
              </View>
            </View>
            <View style={s.dropdownArrowWrap}>
              <Text style={s.dropdownChangeTxt}>{isCityDropdownOpen ? 'Close' : 'Change'}</Text>
              <Ionicons
                name={isCityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#1C1C1E"
              />
            </View>
          </TouchableOpacity>

          {/* Quick Metro City Chips Dropdown */}
          {isCityDropdownOpen && (
            <View style={s.chipsGrid}>
              {POPULAR_CITIES.map((city) => {
                const isSelected = city.name === currentCityName;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.cityChip, isSelected && s.cityChipActive]}
                    onPress={() => pickCity(city)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.cityChipTxt, isSelected && s.cityChipTxtActive]}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Popular Cities & Zones List ── */}
        <Text style={s.sectionTitle}>POPULAR CITIES & AREAS</Text>

        <View style={s.citiesListCard}>
          {filteredCities.map((city, idx) => (
            <TouchableOpacity
              key={city.name}
              style={[s.cityRow, idx === filteredCities.length - 1 && s.cityRowLast]}
              onPress={() => pickCity(city)}
              activeOpacity={0.7}
            >
              <View style={s.cityRowLeft}>
                <Ionicons name="location-outline" size={22} color="#1C1C1E" />
                <View style={s.cityInfo}>
                  <Text style={s.cityName}>{city.name}</Text>
                  <Text style={s.cityState}>{city.state}</Text>
                  <Text style={s.cityZones} numberOfLines={1}>Popular: {city.zones}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  navBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  heading: { fontFamily: Font.extraBold, fontSize: 22, color: '#1C1C1E', marginBottom: 2 },
  subHeading: { fontFamily: Font.regular, fontSize: 12, color: '#8E8E93' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
    color: '#1C1C1E',
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  gpsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTextBox: { flex: 1 },
  gpsPrimary: { fontFamily: Font.extraBold, fontSize: 15, color: '#1C1C1E' },
  gpsSub: { fontFamily: Font.regular, fontSize: 12, color: '#8E8E93', marginTop: 2 },
  enableTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  enableTagTxt: { fontFamily: Font.bold, fontSize: 12, color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  dropdownContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cityDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownLabel: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93' },
  dropdownCityName: { fontFamily: Font.extraBold, fontSize: 15, color: '#1C1C1E', marginTop: 1 },
  dropdownArrowWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dropdownChangeTxt: { fontFamily: Font.bold, fontSize: 12, color: '#1C1C1E' },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cityChipActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  cityChipTxt: { fontFamily: Font.medium, fontSize: 12, color: '#1C1C1E' },
  cityChipTxtActive: { color: '#FFFFFF', fontFamily: Font.bold },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  citiesListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  cityRowLast: { borderBottomWidth: 0 },
  cityRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cityInfo: { flex: 1, gap: 1 },
  cityName: { fontFamily: Font.bold, fontSize: 14, color: '#1C1C1E' },
  cityState: { fontFamily: Font.regular, fontSize: 12, color: '#636366' },
  cityZones: { fontFamily: Font.regular, fontSize: 11, color: '#8E8E93', marginTop: 2 },
});
