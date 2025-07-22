import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export const fcmService = {
  async initFCM(): Promise<void> {
    try {
      const authStatus = await messaging().requestPermission();
      console.log('🔐 Quyền thông báo:', authStatus);

      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'default',
          name: 'Thông báo chung',
          importance: AndroidImportance.HIGH,
        });
        console.log('📢 Notification channel đã được tạo');
      }

      // 👇 THÊM dòng sau để lắng nghe khi app đang mở
      fcmService.listenToForegroundNotifications();

    } catch (err) {
      console.error('❌ Lỗi khi khởi tạo FCM:', err);
    }
  },

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('🎟️ Lấy token thành công:', token);
      return token;
    } catch (err) {
      console.error('❌ Lỗi khi lấy token:', err);
      return null;
    }
  },

  async deleteFCMToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('🗑️ Token đã xoá khỏi thiết bị');
    } catch (err) {
      console.error('❌ Lỗi khi xoá token:', err);
    }
  },

  // ✅ Lắng nghe thông báo foreground và hiển thị local notification
  listenToForegroundNotifications() {
    messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground nhận thông báo:', remoteMessage);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Thông báo',
        body: remoteMessage.notification?.body || 'Bạn có thông báo mới',
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
        },
      });
    });
  },
};
