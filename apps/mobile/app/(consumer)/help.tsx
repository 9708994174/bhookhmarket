import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Font, Sz, Sp, R, Elevation } from '../../constants/theme';

const SUPPORT_TOPICS = [
  { id: '1', icon: 'help-circle-outline', color: '#1976D2', title: 'FAQs', sub: 'Find answers to common questions' },
  { id: '2', icon: 'chatbubbles-outline', color: '#2E7D32', title: 'Contact Us', sub: 'Chat with our support team 24/7' },
  { id: '3', icon: 'alert-circle-outline', color: '#E53935', title: 'Report an Issue', sub: 'Order or store related feedback' },
  { id: '4', icon: 'shield-checkmark-outline', color: '#7B1FA2', title: 'Safety & Quality Guidelines', sub: 'FSSAI standards & food safety' },
];

const QUICK_ANSWERS = [
  {
    q: 'When can I pick up my Surprise Bag?',
    a: 'You can pick up during the designated pickup window shown on your order details screen.',
  },
  {
    q: 'Is the surplus food fresh and safe to eat?',
    a: 'Absolutely! All our verified food partners adhere strictly to FSSAI food hygiene and safety standards. Bags contain fresh unsold items from today.',
  },
  {
    q: 'What is inside a Surprise Bag?',
    a: 'Each bag contains quality unsold food prepared by the kitchen that day at up to 70% off. The exact items vary based on daily surplus.',
  },
  {
    q: 'Can I cancel or refund my order?',
    a: 'Because food is prepared and reserved fresh for you, orders cannot be cancelled after the pickup window begins unless cancelled by the merchant.',
  },
];

export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Main Prompt */}
        <View style={s.promptBox}>
          <Text style={s.promptTitle}>How can we help you?</Text>
          <Text style={s.promptSub}>
            Get quick answers or reach out to our dedicated support team.
          </Text>
        </View>

        {/* Support Topic Cards */}
        <View style={s.topicsGrid}>
          {SUPPORT_TOPICS.map((topic) => (
            <TouchableOpacity key={topic.id} style={s.topicCard} activeOpacity={0.85}>
              <View style={[s.topicIconBox, { backgroundColor: topic.color + '14' }]}>
                <Ionicons name={topic.icon as any} size={22} color={topic.color} />
              </View>
              <View style={s.topicInfo}>
                <Text style={s.topicTitle}>{topic.title}</Text>
                <Text style={s.topicSub}>{topic.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray300} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Answers */}
        <View style={s.quickSec}>
          <Text style={s.secHeader}>Frequently Asked Questions</Text>
          <View style={s.qaList}>
            {QUICK_ANSWERS.map((qa, i) => (
              <View key={i} style={s.qaCard}>
                <View style={s.qaTop}>
                  <Ionicons name="help-circle" size={16} color={Colors.primary} />
                  <Text style={s.qaQuestion}>{qa.q}</Text>
                </View>
                <Text style={s.qaAnswer}>{qa.a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sp.base,
    paddingVertical: Sp.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: Font.bold, fontSize: Sz.md, color: Colors.textPrimary },
  content: { padding: Sp.base, gap: Sp.lg },
  promptBox: { gap: 4 },
  promptTitle: {
    fontFamily: Font.extraBold,
    fontSize: Sz['2xl'],
    color: Colors.textPrimary,
  },
  promptSub: {
    fontFamily: Font.regular,
    fontSize: Sz.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  topicsGrid: { gap: Sp.sm },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Sp.md,
    ...Elevation.card,
  },
  topicIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: { flex: 1, gap: 2 },
  topicTitle: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
  },
  topicSub: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textTertiary,
  },
  quickSec: { gap: Sp.md },
  secHeader: {
    fontFamily: Font.bold,
    fontSize: Sz.md,
    color: Colors.textPrimary,
  },
  qaList: { gap: Sp.sm },
  qaCard: {
    backgroundColor: Colors.white,
    borderRadius: R.xl,
    padding: Sp.base,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  qaTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qaQuestion: {
    fontFamily: Font.bold,
    fontSize: Sz.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  qaAnswer: {
    fontFamily: Font.regular,
    fontSize: Sz.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 22,
  },
});
