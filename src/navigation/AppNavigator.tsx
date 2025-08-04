import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import MainTabNavigator from '../screens/MainTabNavigator';
import DirectionScreen from '../screens/DirectionScreen';
import NotificationScreen from '../screens/NotificationScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import QRScannerScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Đăng nhập' }} />
      <Stack.Screen name="Direction" component={DirectionScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Quên mật khẩu', }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />

      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

    </Stack.Navigator>
  );
}
