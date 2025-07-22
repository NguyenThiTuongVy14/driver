import React from 'react';
import { View, Text } from 'react-native';

export default function ResetPasswordScreen({ route }) {
  const { token } = route.params || {};
  return (
    <View>
      <Text>Reset Password Screen</Text>
      <Text>Token: {token || 'No token'}</Text>
    </View>
  );
}