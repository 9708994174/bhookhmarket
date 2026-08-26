import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

export default ({ config }: ConfigContext): ExpoConfig => {
  const hasGoogleServices = fs.existsSync(path.resolve(__dirname, 'google-services.json'));

  return {
    ...config,
    name: 'BhookhMarket',
    slug: 'bhookhmarket',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.bhookhmarket.app',
      icon: './assets/icon.png',
      infoPlist: {
        NSLocalNetworkUsageDescription:
          'BhookhMarket connects to the local API during development.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
        NSLocationWhenInUseUsageDescription:
          'BhookhMarket needs your location to show nearby Surprise Bags.',
        NSCameraUsageDescription: 'BhookhMarket uses the camera to scan pickup QR codes.',
        LSApplicationQueriesSchemes: ['tez', 'phonepe', 'paytmmp'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        backgroundColor: '#FFFFFF',
      },
      icon: './assets/icon.png',
      package: 'com.bhookhmarket.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'VIBRATE',
      ],
      ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow BhookhMarket to use your location to find nearby Surprise Bags.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Allow BhookhMarket to use the camera to scan pickup QR codes.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://bhookhmarket.onrender.com',
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '',
      },
    },
  };
};
