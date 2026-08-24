import { Redirect } from 'expo-router';
import { useAuthStore } from '../store';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, user, isNewUser } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (isNewUser) {
    return <Redirect href={'/(auth)/location' as any} />;
  }

  // Route based on role
  if (user?.role === 'PARTNER' && user?.partnerProfile?.isActive) {
    return <Redirect href={'/(partner)/(tabs)' as any} />;
  }

  return <Redirect href="/(consumer)/(tabs)" />;
}
