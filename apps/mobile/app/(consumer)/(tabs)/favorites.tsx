import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../../constants/theme';
import { favoriteService } from '../../../services';
import { StoreCardSkeleton } from '../../../components/Skeletons';

export default function FavoritesScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteService.list(),
  });

  const removeMutation = useMutation({
    mutationFn: (partnerId: string) => favoriteService.remove(partnerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const favorites = data?.data?.data ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Favorites</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: Sp.base }}>
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
          }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="heart-outline" size={44} color="#E53935" />
            </View>
            <Text style={s.emptyTitle}>No saved stores yet</Text>
            <Text style={s.emptySub}>
              Tap the heart icon on any store to get quick updates when they post new Surprise Bags.
            </Text>
            <TouchableOpacity
              style={s.exploreBtn}
              onPress={() => router.push('/(consumer)/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={s.exploreTxt}>Explore Surprise Bags</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push('/(consumer)/(tabs)')}
            activeOpacity={0.9}
          >
            <View style={s.cardLeft}>
              {item.partner?.logoImage ? (
                <Image source={{ uri: item.partner.logoImage }} style={s.logo} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <Ionicons name="storefront" size={24} color={Colors.primary} />
                </View>
              )}

              <View style={s.info}>
                <Text style={s.partnerName} numberOfLines={1}>
                  {item.partner?.businessName ?? 'Partner Store'}
                </Text>
                <Text style={s.categoryTxt}>
                  {item.partner?.category ?? 'Store'} · {item.partner?.city ?? 'Nearby'}
                </Text>

                <View style={s.metaRow}>
                  <View style={s.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFB300" />
                    <Text style={s.ratingTxt}>
                      {item.partner?.rating?.toFixed(1) || '4.5'}
                    </Text>
                  </View>

                  {item.partner?.bags?.length > 0 && (
                    <View style={s.bagBadge}>
                      <Text style={s.bagBadgeTxt}>Bag available</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={s.heartBtn}
              onPress={() => removeMutation.mutate(item.partner?.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={22} color="#E53935" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  list: { padding: Sp.base, gap: Sp.base, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.md,
    flex: 1,
  },
  logo: { width: 50, height: 50, borderRadius: 25 },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  partnerName: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  categoryTxt: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: R.xs,
  },
  ratingTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.xs,
    color: Colors.textPrimary,
  },
  bagBadge: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: R.xs,
  },
  bagBadgeTxt: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: Colors.primary,
  },
  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: Sp.xl },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.base,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Sp.lg,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: R.lg,
  },
  exploreTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.white,
  },
});
