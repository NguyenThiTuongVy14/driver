// App.tsx
import React, { useEffect } from 'react';
import AppContainer from './src/AppContainer';
import { fcmService } from './src/services/firebase.service';
import { Linking } from 'react-native';

export default function App() {
  useEffect(() => {
    fcmService.initFCM(); // ✅ Lắng nghe notification & xin quyền
  }, []);

  

  return <AppContainer/>
}