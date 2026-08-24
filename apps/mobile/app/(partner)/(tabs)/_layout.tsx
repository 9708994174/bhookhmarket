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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Font } from '../../../constants/theme';
import { useUIStore } from '../../../store';

const { width } = Dimensions.get('window');

// 4 Navigation Items for Partner: Home, Bags, Orders, Store
const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }
> = {
  index: {
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
  },
  bags: {
    label: 'Bags',
    icon: 'bag-handle',
    iconOutline: 'bag-handle-outline',
  },
  orders: {
    label: 'Orders',
    icon: 'receipt',
    iconOutline: 'receipt-outline',
  },
  profile: {
    label: 'Store',
    icon: 'storefront',
    iconOutline: 'storefront-outline',
  },
};

function CustomPartnerTabBar({ state, descriptors, navigation }: any) {
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

  const visibleRoutes = state.routes.filter(
    (route: any) => TAB_CONFIG[route.name]
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

export default function PartnerTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomPartnerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bags" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
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
  },
  navItemActive: {
    backgroundColor: '#F2F2F7',
  },
  navLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  navLabelActive: {
    fontFamily: Font.bold,
    color: '#000000',
  },
  navLabelInactive: {
    fontFamily: Font.medium,
    color: '#5E5E62',
  },
});
