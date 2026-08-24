import admin from 'firebase-admin';
import { config } from '../config';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    logger.warn('Firebase not configured — push notifications disabled');
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });

  return firebaseApp;
}

export async function sendPushNotification(
  fcmToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  const app = getFirebaseApp();
  if (!app) return;

  try {
    await admin.messaging(app).send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'bhookhmarket_default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Push notification failed:', error);
    // Don't throw — notifications are non-critical
  }
}

export async function sendMulticastNotification(
  fcmTokens: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  const app = getFirebaseApp();
  if (!app || fcmTokens.length === 0) return;

  try {
    const chunks = chunkArray(fcmTokens, 500); // FCM limit
    for (const chunk of chunks) {
      await admin.messaging(app).sendEachForMulticast({
        tokens: chunk,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });
    }
  } catch (error) {
    logger.error('Multicast notification failed:', error);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
