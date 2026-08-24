import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { bagService } from '../../../services';
import { useUIStore } from '../../../store';

export default function PartnerBagsScreen() {
  const queryClient = useQueryClient();
  const { setTabBarVisible } = useUIStore();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SOLD_OUT'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partner-bags-manage'],
    queryFn: () => bagService.getMyBags(),
  });

  const bags = data?.data?.data ?? [];

  const filteredBags = bags.filter((b: any) => {
    if (filter === 'ACTIVE') return b.remainingQuantity > 0;
    if (filter === 'SOLD_OUT') return b.remainingQuantity === 0;
    return true;
  });

  // Track scroll direction to show/hide bottom pill
  const lastScrollY = React.useRef(0);
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Centered Header ── */}
      <View style={s.header}>
        <View style={{ width: 36 }} />
        <Text style={s.headerTitle}>Surplus Bags</Text>
        <TouchableOpacity
          style={s.headerAddBtn}
          onPress={() => router.push('/(partner)/bags/create' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={s.filterRow}>
        {(['ALL', 'ACTIVE', 'SOLD_OUT'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.filterChip, filter === tab && s.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[s.filterChipTxt, filter === tab && s.filterChipTxtActive]}>
              {tab === 'ALL' ? 'All Bags' : tab === 'ACTIVE' ? 'Live & In Stock' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBags}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconCircle}>
              <MaterialCommunityIcons name="shopping-outline" size={44} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>No surplus bags found</Text>
            <Text style={s.emptySub}>Add a new Surprise Bag to list your available unsold food.</Text>
            <TouchableOpacity
              style={s.createBtn}
              onPress={() => router.push('/(partner)/bags/create' as any)}
            >
              <Text style={s.createBtnTxt}>+ Create Surprise Bag</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: bag }) => {
          const discount = Math.round(((bag.originalValue - bag.sellingPrice) / bag.originalValue) * 100);
          const isLive = bag.remainingQuantity > 0;

          return (
            <View style={s.bagCard}>
              <View style={s.bagCardTop}>
                {bag.imageUrl ? (
                  <Image source={{ uri: bag.imageUrl }} style={s.bagImg} />
                ) : (
                  <View style={s.bagImgPlaceholder}>
                    <MaterialCommunityIcons name="food-takeout-box" size={28} color={Colors.primary} />
                  </View>
                )}

                <View style={s.bagDetails}>
                  <Text style={s.bagTitle} numberOfLines={1}>{bag.title}</Text>
                  <Text style={s.bagCategory}>{bag.category || 'Bakery & Pastry'}</Text>
                  <View style={s.priceRow}>
                    <Text style={s.sellingPrice}>₹{bag.sellingPrice}</Text>
                    <Text style={s.origPrice}>₹{bag.originalValue}</Text>
                    <View style={s.discTag}>
                      <Text style={s.discTagTxt}>{discount}% OFF</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={s.bagCardBottom}>
                <View style={s.scheduleInfo}>
                  <Ionicons name="time-outline" size={15} color="#636366" />
                  <Text style={s.scheduleTxt}>
                    {new Date(bag.pickupStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(bag.pickupEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={[s.stockStatusPill, isLive ? s.stockStatusLive : s.stockStatusSold]}>
                  <Text style={[s.stockStatusTxt, isLive ? s.stockStatusTxtLive : s.stockStatusTxtSold]}>
                    {isLive ? `${bag.remainingQuantity} Bags Available` : 'Sold Out'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: '#1C1C1E',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterChipTxt: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: '#636366',
  },
  filterChipTxtActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
    backgroundColor: '#F8F9FA',
  },
  bagCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 12,
    ...Elevation.card,
  },
  bagCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  bagImg: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  bagImgPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagDetails: {
    flex: 1,
  },
  bagTitle: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#1C1C1E',
  },
  bagCategory: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sellingPrice: {
    fontFamily: Font.extraBold,
    fontSize: 16,
    color: '#1B5E20',
  },
  origPrice: {
    fontFamily: Font.medium,
    fontSize: 12.5,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  discTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discTagTxt: {
    fontFamily: Font.bold,
    fontSize: 10.5,
    color: '#1B5E20',
  },
  bagCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleTxt: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#636366',
  },
  stockStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockStatusLive: {
    backgroundColor: '#E8F5E9',
  },
  stockStatusSold: {
    backgroundColor: '#FEE2E2',
  },
  stockStatusTxt: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  stockStatusTxtLive: {
    color: '#1B5E20',
  },
  stockStatusTxtSold: {
    color: '#DC2626',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.md,
    color: '#1C1C1E',
  },
  emptySub: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  createBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
  },
  createBtnTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: '#FFFFFF',
  },
});
