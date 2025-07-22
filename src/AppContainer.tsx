import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './theme/ThemeContext';
import { navigationRef } from './navigation/navigationRef';
const linking = {
  prefixes: [
    'https://backend-springboot-latest.onrender.com',
    'colector://',
  ],
  config: {
    screens: {
      ResetPassword: {
        path: 'deeplink/reset-password',
      },
    },
  },
};

export default function AppContainer() {
  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
