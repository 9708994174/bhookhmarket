import { Stack } from 'expo-router';

export default function PartnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bags/create" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
