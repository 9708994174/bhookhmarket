import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Font } from '../../constants/theme';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    icon: 'bag-handle-outline',
    title: 'New Surprise Bags Nearby',
    desc: "The Baker's Dozen just listed 5 fresh surplus pastry bags.",
    time: '5m ago',
    unread: true,
  },
  {
    id: '2',
    icon: 'checkmark-circle-outline',
    title: 'Order Confirmed',
    desc: 'Your surprise bag order #BM-8823 is confirmed and ready for pickup.',
    time: '20m ago',
    unread: true,
  },
  {
    id: '3',
    icon: 'time-outline',
    title: 'Pickup Window Reminder',
    desc: 'Your pickup starts in 30 minutes (8:00 PM – 9:00 PM today).',
    time: '1h ago',
    unread: false,
  },
  {
    id: '4',
    icon: 'star-outline',
    title: 'Rate Your Meal Box',
    desc: 'Help your local cafe and community by sharing a quick review.',
    time: '3h ago',
    unread: false,
  },
  {
    id: '5',
    icon: 'pricetag-outline',
    title: 'Flash Surplus Alert',
    desc: 'Over 12 bakeries in your area have bags up to 70% off right now.',
    time: '1d ago',
    unread: false,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Centered Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Notifications</Text>

        <TouchableOpacity onPress={markAllAsRead} style={s.readAllBtn} activeOpacity={0.7}>
          <Text style={s.readAllTxt}>Mark read</Text>
        </TouchableOpacity>
      </View>

      {/* ── Notifications List ── */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.notifItem, item.unread && s.notifUnread]}
            activeOpacity={0.8}
            onPress={() => {
              setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
              );
            }}
          >
            {/* Clean Monochrome Icon without color */}
            <View style={s.iconBox}>
              <Ionicons name={item.icon as any} size={22} color="#1C1C1E" />
            </View>

            <View style={s.info}>
              <View style={s.topRow}>
                <Text style={[s.title, item.unread && s.titleUnread]}>{item.title}</Text>
                <Text style={s.time}>{item.time}</Text>
              </View>
              <Text style={s.desc}>{item.desc}</Text>
            </View>

            {item.unread && <View style={s.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 2 },
  headerTitle: { fontFamily: Font.extraBold, fontSize: 18, color: '#1C1C1E' },
  readAllBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  readAllTxt: { fontFamily: Font.bold, fontSize: 12, color: '#1B5E20' },
  list: { paddingBottom: 20 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  notifUnread: {
    backgroundColor: '#F9FAF9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontFamily: Font.extraBold,
  },
  time: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: '#8E8E93',
  },
  desc: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: '#636366',
    lineHeight: 18,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1B5E20',
    marginTop: 6,
  },
});
