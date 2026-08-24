import { Stack } from 'expo-router';

export default function ConsumerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bags/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="checkout/[bagId]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="payment/[orderId]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="orders/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="review/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="impact" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
