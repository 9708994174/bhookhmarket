import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../constants/theme';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

export default function ImpactScreen() {
  const { user } = useAuthStore();
  const impact = (user as any)?.impactStats;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Environmental Impact</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Big Illustration Badge */}
        <View style={s.illustContainer}>
          <View style={s.bagCircle}>
            <MaterialCommunityIcons name="earth" size={80} color="#2E7D32" />
          </View>
        </View>

        {/* Headlines */}
        <View style={s.titleBox}>
          <Text style={s.mainHeading}>Thanks for rescuing food!</Text>
          <Text style={s.subHeading}>
            Every Surprise Bag you rescue saves perfectly edible meals from landfills and directly cuts carbon emissions.
          </Text>
        </View>

        {/* Big Highlight Badge */}
        <View style={s.highlightBadge}>
          <Text style={s.highlightTxt}>You saved ₹{impact?.totalMoneySaved ?? '1,450'}</Text>
          <Text style={s.highlightSub}>and helped rescue {impact?.totalBagsRescued ?? 12} meals so far</Text>
        </View>

        {/* 3 Impact Stats Grid */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: Colors.primarySurface }]}>
              <MaterialCommunityIcons name="shopping" size={24} color={Colors.primary} />
            </View>
            <Text style={s.statVal}>{impact?.totalBagsRescued ?? 12}</Text>
            <Text style={s.statLabel}>Meals Rescued</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf" size={24} color="#2E7D32" />
            </View>
            <Text style={s.statVal}>{impact?.totalCo2Saved ?? '30'} kg</Text>
            <Text style={s.statLabel}>CO2 Prevented</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="water" size={24} color="#1976D2" />
            </View>
            <Text style={s.statVal}>{impact?.totalFoodSaved ? `${impact.totalFoodSaved * 100} L` : '1,200 L'}</Text>
            <Text style={s.statLabel}>Water Saved</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={s.bottomCta}>
        <TouchableOpacity
          style={s.orderAgainBtn}
          onPress={() => router.push('/(consumer)/(tabs)')}
          activeOpacity={0.9}
        >
          <Text style={s.orderAgainTxt}>Rescue Another Bag</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => router.replace('/(consumer)/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={s.homeTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  content: { padding: Sp.base, gap: Sp.lg, alignItems: 'center' },
  illustContainer: {
    alignItems: 'center',
    marginVertical: Sp.md,
  },
  bagCircle: {
    width: width * 0.44,
    height: width * 0.44,
    borderRadius: (width * 0.44) / 2,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: { alignItems: 'center', gap: 6, paddingHorizontal: Sp.md },
  mainHeading: {
    fontFamily: Font.extraBold,
    fontSize: Sz['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subHeading: {
    fontFamily: Font.regular,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlightBadge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: R.xl,
    paddingVertical: Sp.md,
    paddingHorizontal: Sp.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primaryLight + '50',
  },
  highlightTxt: {
    fontFamily: Font.extraBold,
    fontSize: Sz.xl,
    color: Colors.primary,
  },
  highlightSub: {
    fontFamily: Font.medium,
    fontSize: Sz.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Sp.sm,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: R.xl,
    paddingVertical: Sp.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: {
    fontFamily: Font.extraBold,
    fontSize: Sz.base,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  bottomCta: {
    paddingHorizontal: Sp.base,
    paddingBottom: Sp.base,
    paddingTop: Sp.sm,
    gap: Sp.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  orderAgainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orderAgainTxt: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.white,
  },
  homeBtn: {
    borderRadius: R.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  homeTxt: {
    fontFamily: Font.semiBold,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
  },
});
