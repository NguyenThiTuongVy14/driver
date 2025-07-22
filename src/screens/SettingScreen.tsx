import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../services/auth.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../theme/ThemeContext';

// --- Định nghĩa kiểu (Type Definitions) ---
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MainTabs: undefined;
  AccountDetail: undefined;
  NotificationSettings: undefined;
  PrivacyPolicy: undefined;
  AboutApp: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// --- Component SettingScreen ---
export default function SettingScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const { toggleTheme, theme } = useTheme();
  const { colors, isDark } = useAppColors();
  const scaleAnim = new Animated.Value(1);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const navigateTo = (screenName: keyof RootStackParamList) => {
    // @ts-ignore
    navigation.navigate(screenName);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const SettingItem = ({
    icon,
    title,
    onPress,
    showArrow = true,
    rightComponent = null,
    isLast = false,
    iconColor = colors.primary
  }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        !isLast && { borderBottomColor: colors.borderLight, borderBottomWidth: StyleSheet.hairlineWidth }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.labelText, { color: colors.text }]}>{title}</Text>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={18} color={colors.subText} />
      ))}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header với avatar và tên */}
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { }]}>
          <Image
            source={{ uri: 'https://media.hswstatic.com/eyJidWNrZXQiOiJjb250ZW50Lmhzd3N0YXRpYy5jb20iLCJrZXkiOiJnaWZcL3BsYXlcLzBiN2Y0ZTliLWY1OWMtNDAyNC05ZjA2LWIzZGMxMjg1MGFiNy0xOTIwLTEwODAuanBnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjo4Mjh9fX0=' }} // hoặc require('./path/to/image.png')
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Cài đặt</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Tùy chỉnh ứng dụng của bạn</Text>
      </View>

      {/* Thẻ cài đặt chính */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <SettingItem
          icon="moon-outline"
          title="Chế độ tối"
          onPress={() => { }}
          showArrow={false}
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary + '40' }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.switchTrackOff}
            />
          }
        />

        <SettingItem
          icon="person-circle-outline"
          title="Tài khoản"
          onPress={() => navigateTo('AccountDetail')}
        />

        <SettingItem
          icon="notifications-outline"
          title="Thông báo"
          onPress={() => navigateTo('NotificationSettings')}
          isLast={true}
        />
      </View>

      {/* Thẻ thông tin và bảo mật */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <SettingItem
          icon="shield-checkmark-outline"
          title="Chính sách bảo mật"
          onPress={() => navigateTo('PrivacyPolicy')}
          iconColor="#FF6B6B"
        />

        <SettingItem
          icon="help-circle-outline"
          title="Hỗ trợ"
          onPress={() => { }}
          iconColor="#4ECDC4"
        />

        <SettingItem
          icon="information-circle-outline"
          title="Về ứng dụng"
          onPress={() => navigateTo('AboutApp')}
          iconColor="#45B7D1"
          isLast={true}
        />
      </View>

      {/* Thẻ cài đặt nâng cao */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <SettingItem
          icon="language-outline"
          title="Ngôn ngữ"
          onPress={() => { }}
          iconColor="#96CEB4"
        />

        <SettingItem
          icon="download-outline"
          title="Quản lý bộ nhớ"
          onPress={() => { }}
          iconColor="#FFEAA7"
        />

        <SettingItem
          icon="star-outline"
          title="Đánh giá ứng dụng"
          onPress={() => { }}
          iconColor="#FD79A8"
          isLast={true}
        />
      </View>

      {/* Nút Đăng xuất với animation */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.logoutButton, {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
            borderColor: colors.danger + '20',
            borderWidth: 1
          }]}
          onPress={handleLogout}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={[styles.logoutIconContainer, { backgroundColor: colors.danger + '15' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </View>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.subText }]}>
          Phiên bản 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    width:100,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "#ffffff"
  },
});