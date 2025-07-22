// App.tsx
import React, { useEffect } from 'react';
import AppContainer from './src/AppContainer';
import { fcmService } from './src/services/firebase.service';
import { Linking } from 'react-native';

export default function App() {
  useEffect(() => {
    fcmService.initFCM(); // ✅ Lắng nghe notification & xin quyền
  }, []);

  useEffect(() => {
    const handleUrl = (url: string) => {
      console.log('📥 Deeplink URL:', url);
      const match = url.match(/token=([^&]+)/);
      if (match?.[1]) {
        navigate('ResetPassword', { token: match[1] });
      }
    };

    const checkInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleUrl(url);
    };

    const onReceiveURL = ({ url }: { url: string }) => handleUrl(url);

    Linking.addEventListener('url', onReceiveURL);
    checkInitialUrl();

    return () => {
      Linking.removeEventListener('url', onReceiveURL);
    };
  }, []);

  return <AppContainer/>
}