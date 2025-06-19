import React, { useEffect, useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  Provider as PaperProvider,
  DefaultTheme,
  Text,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { login } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorMessage from '../components/ErrorMessage';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MainTabs: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(true); // để kiểm tra token lúc đầu
  const [error, setError] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('MainTabs');
      } else {
        setLoading(false); 
      }
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Thông tin đăng nhập bị trống');
      return;
    }

    try {
      const data = await login(username, password);
      if (data) {
        await AsyncStorage.setItem('token', data);
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Lỗi', 'Không nhận được token đăng nhập');
      }
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.toString());
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (

    <PaperProvider theme={theme}>
      <ErrorMessage message={error} onHide={() => setError('')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.box}>
          <Text variant="titleLarge" style={styles.title}>
            🌿 Đăng nhập
          </Text>

          <TextInput
            label="Tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={isPasswordVisible ? 'eye-off' : 'eye'}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            }
          />

          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Đăng nhập
          </Button>
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4CAF50',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 4,
  },
});
