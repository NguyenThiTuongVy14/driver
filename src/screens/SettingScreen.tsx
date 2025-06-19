import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../services/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../theme/ThemeContext';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MainTabs: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function SettingScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const { toggleTheme, theme } = useTheme();
  const { colors, isDark } = useAppColors();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container(colors)]}>
      <Text style={styles.title(colors)}>Cài đặt</Text>

      <View style={styles.card(colors)}>
        <View style={styles.option(colors)}>
          <Ionicons name="moon-outline" size={22} color={colors.icon} />
          <Text style={styles.label(colors)}>Chế độ tối</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>

        <TouchableOpacity style={styles.option(colors)}>
          <Ionicons name="person-circle-outline" size={22} color={colors.icon} />
          <Text style={styles.label(colors)}>Tài khoản</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option(colors)}>
          <Ionicons name="notifications-outline" size={22} color={colors.icon} />
          <Text style={styles.label(colors)}>Thông báo</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton(colors)} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
        <Text style={[styles.label(colors), { color: '#e74c3c' }]}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  container: (colors) => ({
    padding: 20,
    flexGrow: 1,
    backgroundColor: colors.background,
  }),
  title: (colors) => ({
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: colors.text,
  }),
  card: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 32,
  }),
  option: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  }),
  label: (colors) => ({
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  }),
  logoutButton: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  }),
};
