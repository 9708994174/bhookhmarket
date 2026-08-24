import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font } from '../../../constants/theme';
import { useUIStore } from '../../../store';

const { width } = Dimensions.get('window');

// 4 Navigation Items: Home, Map, Order, Profile
const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }
> = {
  index: {
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
  },
  map: {
    label: 'Map',
    icon: 'map',
    iconOutline: 'map-outline',
  },
  orders: {
    label: 'Order',
    icon: 'receipt',
    iconOutline: 'receipt-outline',
  },
  profile: {
    label: 'Profile',
    icon: 'person',
    iconOutline: 'person-outline',
  },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isTabBarVisible } = useUIStore();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isTabBarVisible ? 0 : 120,
      friction: 8,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  // Show the 4 core routes in the floating navigation pill
  const visibleRoutes = state.routes.filter(
    (route: any) => route.name !== 'favorites' && TAB_CONFIG[route.name]
  );

  return (
    <Animated.View
      style={[
        s.outerWrapper,
        {
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={s.navigationBar}>
        {visibleRoutes.map((route: any) => {
          const isFocused = state.routes[state.index]?.name === route.name;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            icon: 'ellipse',
            iconOutline: 'ellipse-outline',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
              activeOpacity={0.75}
              onPress={onPress}
              style={[s.navItem, isFocused && s.navItemActive]}
            >
              <Ionicons
                name={isFocused ? config.icon : config.iconOutline}
                size={20}
                color={isFocused ? '#000000' : '#5E5E62'}
              />
              <Text
                style={[s.navLabel, isFocused ? s.navLabelActive : s.navLabelInactive]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
      {/* Liked / Favorites tab accessible via top header */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 22,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Math.min(width * 0.82, 340),
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    gap: 2,
  },
  navItemActive: {
    backgroundColor: '#F2F2F7', // Uber-style light-gray rounded capsule background
  },
  navLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  navLabelActive: {
    fontFamily: Font.bold,
    color: '#000000',
  },
  navLabelInactive: {
    fontFamily: Font.medium,
    color: '#71717A',
  },
});
