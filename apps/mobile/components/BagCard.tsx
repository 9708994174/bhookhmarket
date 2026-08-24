import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/theme';

const { width } = Dimensions.get('window');

interface BagCardProps {
  bag: {
    id: string;
    title: string;
    imageUrl?: string | null;
    originalValue: number;
    sellingPrice: number;
    discountPercent?: number;
    remainingQuantity: number;
    pickupStart: string;
    pickupEnd: string;
    distance?: number | null;
    partner: {
      id: string;
      businessName: string;
      category: string;
      rating: number;
      totalRatings: number;
    };
  };
  onPress: () => void;
}

export function BagCard({ bag, onPress }: BagCardProps) {
  const discount =
    bag.discountPercent ??
    Math.round(((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100);

  const formatPickupTime = () => {
    const start = new Date(bag.pickupStart);
    const end = new Date(bag.pickupEnd);
    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const isLowStock = bag.remainingQuantity <= 2;
  const isSoldOut = bag.remainingQuantity === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Discount badge */}
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>{discount}% OFF</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Left: Info */}
        <View style={styles.info}>
          {/* Partner name & category */}
          <View style={styles.partnerRow}>
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(bag.partner.category) }]} />
            <Text style={styles.partnerName} numberOfLines={1}>
              {bag.partner.businessName}
            </Text>
          </View>

          <Text style={styles.bagTitle} numberOfLines={1}>{bag.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#FFB300" />
              <Text style={styles.ratingText}>{bag.partner.rating.toFixed(1)}</Text>
            </View>

            {bag.distance != null && (
              <View style={styles.distBadge}>
                <Ionicons name="location-sharp" size={11} color={Colors.textTertiary} />
                <Text style={styles.metaText}>{bag.distance} km</Text>
              </View>
            )}
          </View>

          {/* Pickup time */}
          <View style={styles.pickupRow}>
            <Ionicons name="time-outline" size={12} color={Colors.primary} />
            <Text style={styles.pickupTime}>{formatPickupTime()}</Text>
          </View>

          {/* Pricing */}
          <View style={styles.pricingRow}>
            <Text style={styles.originalPrice}>₹{bag.originalValue}</Text>
            <Text style={styles.sellingPrice}>₹{bag.sellingPrice}</Text>
          </View>

          {/* Quantity */}
          <View style={[styles.quantityBadge, isLowStock && styles.quantityBadgeLow, isSoldOut && styles.quantityBadgeSoldOut]}>
            <Text style={[styles.quantityText, isLowStock && styles.quantityTextLow, isSoldOut && styles.quantityTextSoldOut]}>
              {isSoldOut ? 'Sold Out' : isLowStock ? `${bag.remainingQuantity} left` : `${bag.remainingQuantity} available`}
            </Text>
          </View>
        </View>

        {/* Right: Image */}
        <View style={styles.imageContainer}>
          {bag.imageUrl ? (
            <Image source={{ uri: bag.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="shopping" size={36} color={Colors.primary} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    BAKERY: Colors.bakery,
    CAFE: Colors.cafe,
    RESTAURANT: Colors.restaurant,
    HOTEL: Colors.hotel,
    SUPERMARKET: Colors.supermarket,
    CATERER: Colors.caterer,
    CLOUD_KITCHEN: Colors.cloudKitchen,
  };
  return map[category] ?? Colors.gray400;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadow.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 6,
    paddingTop: Spacing.lg,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  partnerName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  bagTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickupTime: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  sellingPrice: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
  quantityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successSurface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  quantityBadgeLow: {
    backgroundColor: Colors.warningSurface,
  },
  quantityBadgeSoldOut: {
    backgroundColor: Colors.errorSurface,
  },
  quantityText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
  },
  quantityTextLow: {
    color: Colors.warning,
  },
  quantityTextSoldOut: {
    color: Colors.error,
  },
  imageContainer: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
