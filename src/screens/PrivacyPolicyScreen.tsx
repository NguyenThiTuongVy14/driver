import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppColors } from '../hooks/useAppColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Type Definitions ---
type RootStackParamList = {
  MainTabs: undefined;
  Setting: undefined;
};

type PrivacyPolicyScreenProp = NativeStackNavigationProp<RootStackParamList, 'Setting'>;

// --- Component PrivacyPolicyScreen ---
export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyPolicyScreenProp>();
  const { colors, isDark } = useAppColors();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Không thể mở liên kết", err));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton} // Đã tăng padding ở đây
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Thêm hitSlop
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chính sách bảo mật</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: styles.contentContainer.paddingBottom + insets.bottom }
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Giới thiệu</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chào mừng bạn đến với Chính sách bảo mật của chúng tôi. Chúng tôi cam kết bảo vệ quyền riêng tư của người dùng. Tài liệu này giải thích cách chúng tôi thu thập, sử dụng và chia sẻ thông tin cá nhân của bạn.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Thông tin chúng tôi thu thập</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chúng tôi có thể thu thập các loại thông tin sau:
        </Text>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Thông tin bạn cung cấp trực tiếp (ví dụ: tên, email khi đăng ký tài khoản).
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Thông tin tự động thu thập (ví dụ: dữ liệu sử dụng ứng dụng, loại thiết bị).
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Dữ liệu vị trí (nếu bạn cho phép).
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Cách chúng tôi sử dụng thông tin của bạn</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Thông tin thu thập được sử dụng để:
        </Text>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Cung cấp và cải thiện dịch vụ của chúng tôi.
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Cá nhân hóa trải nghiệm người dùng.
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.subText} style={styles.bulletIcon} />
          <Text style={[styles.bulletText, { color: colors.text }]}>
            Gửi thông báo và cập nhật quan trọng.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Chia sẻ thông tin</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi chỉ chia sẻ thông tin khi cần thiết để cung cấp dịch vụ, tuân thủ pháp luật hoặc bảo vệ quyền lợi của chúng tôi.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Quyền của bạn</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Bạn có quyền truy cập, sửa đổi hoặc xóa thông tin cá nhân của mình. Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua địa chỉ email:{' '}
          <TouchableOpacity onPress={() => openExternalLink('mailto:support@yourdomain.com')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>support@yourdomain.com</Text>
          </TouchableOpacity>
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Thay đổi Chính sách này</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được đăng tải trên trang này.
        </Text>

        <Text style={[styles.lastUpdated, { color: colors.subText }]}>
          Cập nhật lần cuối: 25 tháng 6, 2025
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop:30
    paddingVertical:30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 15, // Tăng padding từ 8 lên 15 để mở rộng vùng chạm
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40, // Giữ nguyên để căn chỉnh tiêu đề
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginLeft: 10,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 30,
    fontStyle: 'italic',
  },
});