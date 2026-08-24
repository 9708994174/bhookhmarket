import React from 'react';
import { Redirect } from 'expo-router';

export default function PartnerDashboardRedirect() {
  return <Redirect href={'/(partner)/(tabs)' as any} />;
}
