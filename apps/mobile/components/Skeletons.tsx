import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/** Base shimmering box component */
export function SkeletonBox({
  width: w = '100%',
  height: h = 20,
  borderRadius = 8,
  style,
}: {
  width?: any;
  height?: any;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius,
          backgroundColor: '#E5E5EA',
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Bag Card Skeleton for Home and Discovery lists */
export function BagCardSkeleton() {
  return (
    <View style={s.card}>
      <SkeletonBox width="100%" height={140} borderRadius={16} />
      <View style={s.cardInfo}>
        <View style={s.rowBetween}>
          <SkeletonBox width="60%" height={16} borderRadius={6} />
          <SkeletonBox width="20%" height={14} borderRadius={6} />
        </View>
        <SkeletonBox width="40%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
        <View style={[s.rowBetween, { marginTop: 14 }]}>
          <View style={s.row}>
            <SkeletonBox width={60} height={20} borderRadius={6} />
            <SkeletonBox width={45} height={14} borderRadius={6} style={{ marginLeft: 8 }} />
          </View>
          <SkeletonBox width={85} height={34} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Order Card Skeleton for Orders list */
export function OrderCardSkeleton() {
  return (
    <View style={s.orderCard}>
      <View style={s.rowBetween}>
        <View style={s.row}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={{ marginLeft: 12 }}>
            <SkeletonBox width={120} height={16} borderRadius={6} />
            <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonBox width={70} height={24} borderRadius={12} />
      </View>
      <View style={s.divider} />
      <View style={s.rowBetween}>
        <SkeletonBox width={100} height={14} borderRadius={4} />
        <SkeletonBox width={60} height={18} borderRadius={4} />
      </View>
    </View>
  );
}

/** Favorite / Store Card Skeleton */
export function StoreCardSkeleton() {
  return (
    <View style={s.storeCard}>
      <SkeletonBox width={64} height={64} borderRadius={12} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <SkeletonBox width="70%" height={16} borderRadius={6} />
        <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <SkeletonBox width="35%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={28} height={28} borderRadius={14} />
    </View>
  );
}

/** Product Detail Screen Skeleton */
export function DetailScreenSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SkeletonBox width="100%" height={260} borderRadius={0} />
      <View style={{ padding: 20, gap: 14 }}>
        <SkeletonBox width="70%" height={24} borderRadius={8} />
        <SkeletonBox width="45%" height={16} borderRadius={6} />
        <View style={s.divider} />
        <SkeletonBox width="100%" height={80} borderRadius={12} />
        <SkeletonBox width="100%" height={120} borderRadius={12} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 14,
  },
  cardInfo: {
    padding: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 12,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
});
