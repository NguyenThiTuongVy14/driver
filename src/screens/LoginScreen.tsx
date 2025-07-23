import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Provider as PaperProvider,
  DefaultTheme,
  Text,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/auth.service';
import CustomAlert from '../components/CustomAlert';
import { useAppColors } from '../hooks/useAppColors';


// --- Type Definitions ---
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MainTabs: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// --- Clean Theme ---
const paperTheme = {
  ...DefaultTheme,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#22c55e',
    accent: '#16a34a',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    placeholder: '#9ca3af',
    onSurface: '#374151',
    backdrop: 'rgba(0,0,0,0.5)',
  },
};

// --- Main Login Screen Component ---
export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const { colors, isDark } = useAppColors();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Custom Alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<string>('success');

  // Simple fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          navigation.replace('MainTabs');
        } else {
          setIsLoadingInitial(false);
          // Simple fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }
      } catch (e) {
        console.error("Failed to read token from AsyncStorage", e);
        setIsLoadingInitial(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setAlertMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      console.log('first')
      const data = await login(username, password);
      if (data) {
        await AsyncStorage.setItem('token', data);
        setAlertMessage('Đăng nhập thành công!');
        setAlertType('success');
        setShowAlert(true);
        setTimeout(() => navigation.replace('MainTabs'), 1000);
      } else {
        setAlertMessage('Không nhận được token đăng nhập. Vui lòng thử lại.');
        setAlertType('error');
        setShowAlert(true);
      }
    } catch (error) {
      const errorMessage = error.message && typeof error.message === 'string'
        ? error.message.includes('Network Error')
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.'
          : error.message
        : 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.';
      setAlertMessage(errorMessage);
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingEmoji}>♻️</Text>
          <ActivityIndicator size="large" color="#22c55e" style={styles.loader} />
          <Text style={styles.loadingText}>Đang kiểm tra phiên đăng nhập...</Text>
        </View>
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Custom Alert */}
            {showAlert && (
              <CustomAlert
                message={alertMessage}
                type={alertType}
                isVisible={showAlert}
                onClose={() => setShowAlert(false)}
              />
            )}

            <Animated.View style={[styles.loginCard, { opacity: fadeAnim }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logo}>♻️</Text>
                </View>
                <Text style={styles.title}>Chào mừng trở lại</Text>
                <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  {/* <Text style={styles.inputLabel}>Tên đăng nhập</Text> */}
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    mode="outlined"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="Nhập tên đăng nhập"
                  />
                </View>

                <View style={styles.inputGroup}>
                  {/* <Text style={styles.inputLabel}>Mật khẩu</Text> */}
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    mode="outlined"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    placeholder="Nhập mật khẩu"
                    right={
                      <TextInput.Icon
                        icon={isPasswordVisible ? 'eye-off' : 'eye'}
                        iconColor="#9ca3af"
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      />
                    }
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoggingIn}
                  activeOpacity={0.9}
                >
                  {isLoggingIn ? (
                    <View style={styles.loadingButtonContent}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.buttonText}>Đang đăng nhập...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Đăng nhập</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.forgotPassword}
                  onPress={() => navigation.navigate('RegisterDriver')}>
                  <Text style={styles.forgotPasswordText}>Đăng ký làm tài xế</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </PaperProvider>
  );
}

// --- Clean Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  inputOutline: {
    borderColor: '#e5e7eb',
    borderWidth: 1.5,
  },
  inputContent: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    alignItems: 'center',
  },
  forgotPassword: {
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '500',
  },
});