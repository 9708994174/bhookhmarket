import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  ImageBackground,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function PartnerOnboardingScreen() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Realistic Bakery & Cafe Flatlay Background ── */}
      <ImageBackground
        source={require('../../assets/partner_bg.jpg')}
        style={s.bgImage}
        resizeMode="cover"
      >
        <SafeAreaView style={s.safe} edges={['top']}>
          {/* Top Back Navigation Bar */}
          <View style={s.navRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={s.backPill}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={22} color="#0B4D26" />
            </TouchableOpacity>
            <View style={s.headerTitleBadge}>
              <Text style={s.headerTitleTxt}>Partner Registration</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top spacing allowing the background food photography to shine */}
            <View style={s.topHeroSpacer} />

            {/* ── White Curved Card Bottom Sheet ── */}
            <View style={s.bottomSheet}>
              {/* Brand Logo & Theme Header */}
              <View style={s.sheetBrandHeader}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={s.sheetLogo}
                  resizeMode="contain"
                />
                <View style={s.kickerRow}>
                  <View style={s.kickerLine} />
                  <Ionicons name="leaf" size={12} color="#2E7D32" style={s.kickerLeaf} />
                  <View style={s.kickerLine} />
                </View>
                <Text style={s.kickerTxt}>RESCUE MORE. WASTE LESS.</Text>
              </View>

              {/* 3D Storefront Feature Card */}
              <View style={s.storeHeroCard}>
                <Image
                  source={require('../../assets/partner_store_3d.jpg')}
                  style={s.store3dImage}
                  resizeMode="cover"
                />
                <View style={s.storeHeroContent}>
                  <Text style={s.storeHeroTitle}>Join 500+ Partner Stores</Text>
                  <Text style={s.storeHeroSub}>
                    Bakeries, cafes, and restaurants turn daily surplus into revenue in 3 easy steps.
                  </Text>
                </View>
              </View>

              {/* 3 Value Proposition Bullets */}
              <View style={s.propsContainer}>
                <View style={s.propRow}>
                  <View style={s.propBulletCircle}>
                    <Ionicons name="flash" size={15} color="#0B4D26" />
                  </View>
                  <View style={s.propTextCol}>
                    <Text style={s.propTitle}>List in under 60 seconds</Text>
                    <Text style={s.propDesc}>Add Surprise Bags whenever you have surplus stock</Text>
                  </View>
                </View>

                <View style={s.propRow}>
                  <View style={s.propBulletCircle}>
                    <Ionicons name="storefront" size={15} color="#0B4D26" />
                  </View>
                  <View style={s.propTextCol}>
                    <Text style={s.propTitle}>Direct store pickup</Text>
                    <Text style={s.propDesc}>Customers pick up their bags at your specified hours</Text>
                  </View>
                </View>

                <View style={s.propRow}>
                  <View style={s.propBulletCircle}>
                    <Ionicons name="shield-checkmark" size={15} color="#0B4D26" />
                  </View>
                  <View style={s.propTextCol}>
                    <Text style={s.propTitle}>Guaranteed weekly payouts</Text>
                    <Text style={s.propDesc}>Automated bank transfers with transparent analytics</Text>
                  </View>
                </View>
              </View>

              {/* Register Action CTA Button */}
              <TouchableOpacity
                style={s.registerBtn}
                onPress={() => router.push('/(auth)/partner-signup')}
                activeOpacity={0.9}
              >
                <View style={{ width: 34 }} />
                <Text style={s.registerTxt}>Register New Partner Store</Text>
                <View style={s.arrowCircle}>
                  <Ionicons name="arrow-forward" size={18} color="#0B4D26" />
                </View>
              </TouchableOpacity>

              {/* Already Registered Login Link */}
              <View style={s.loginRow}>
                <Text style={s.loginSub}>Already registered as a partner? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={s.loginBold}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safe: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.lg,
    paddingTop: Sp.sm,
    zIndex: 10,
  },
  backPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.sm,
  },
  headerTitleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Elevation.sm,
  },
  headerTitleTxt: {
    fontFamily: Font.bold,
    fontSize: 14.5,
    color: '#0B4D26',
    letterSpacing: 0.2,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  topHeroSpacer: {
    height: 180,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Sp.xl,
    paddingTop: Sp.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    ...Elevation.lg,
  },
  sheetBrandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetLogo: {
    width: 175,
    height: 48,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  kickerLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.35)',
  },
  kickerLeaf: {
    marginHorizontal: 2,
  },
  kickerTxt: {
    fontSize: 10.5,
    fontFamily: Font.bold,
    color: '#2E7D32',
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  storeHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAF6',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4EAD9',
    marginBottom: 18,
    gap: 12,
  },
  store3dImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  storeHeroContent: {
    flex: 1,
  },
  storeHeroTitle: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: '#0B4D26',
    marginBottom: 3,
  },
  storeHeroSub: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#555555',
    lineHeight: 16,
  },
  propsContainer: {
    gap: 14,
    marginBottom: 22,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  propBulletCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  propTextCol: {
    flex: 1,
  },
  propTitle: {
    fontSize: 13.5,
    fontFamily: Font.semiBold,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  propDesc: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#636366',
    lineHeight: 16,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B4D26',
    borderRadius: 28,
    height: 54,
    paddingHorizontal: 10,
    ...Elevation.md,
    marginBottom: 16,
  },
  registerTxt: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginSub: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#636366',
  },
  loginBold: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#0B4D26',
  },
});

