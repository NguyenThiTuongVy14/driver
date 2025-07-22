import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppColors } from '../hooks/useAppColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Đảm bảo đã cài đặt và sử dụng Safe Area Provider

// --- Định nghĩa kiểu (TypeScript) ---
type RootStackParamList = {
  Setting: undefined; // Quay lại màn hình Cài đặt
  PrivacyPolicy: undefined; // Có thể liên kết đến Chính sách bảo mật
  // Thêm các màn hình khác nếu cần
};

type AboutAppScreenProp = NativeStackNavigationProp<RootStackParamList, 'Setting'>;

// --- Component AboutAppScreen ---
export default function AboutAppScreen() {
  const navigation = useNavigation<AboutAppScreenProp>();
  const { colors, isDark } = useAppColors();
  const insets = useSafeAreaInsets(); // Lấy giá trị insets để điều chỉnh padding

  const handleGoBack = () => {
    navigation.goBack(); // Quay lại màn hình trước đó
  };

  const navigateToPrivacyPolicy = () => {
    // @ts-ignore
    navigation.navigate('PrivacyPolicy'); // Điều hướng đến trang Chính sách bảo mật
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
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Tăng vùng chạm
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Về ứng dụng</Text>
        <View style={styles.placeholder} /> {/* Dùng để căn giữa tiêu đề */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: styles.contentContainer.paddingBottom + insets.bottom } // Đảm bảo nội dung không bị che
        ]}
      >
        {/* Phần Giới thiệu chung */}
        <View style={styles.appIntro}>
          <Ionicons name="leaf-outline" size={60} color={colors.primary} style={styles.appLogoIcon} />
          <Text style={[styles.appName, { color: colors.primary }]}>[Tên Ứng Dụng Của Bạn]</Text>
          <Text style={[styles.appSlogan, { color: colors.subText }]}>
            Kết nối - Tự động hóa - Vì một môi trường xanh
          </Text>
          <Text style={[styles.paragraph, { color: colors.text, textAlign: 'center' }]}>
            Chào mừng bạn đến với [Tên Ứng Dụng Của Bạn] - giải pháp tiên phong trong việc **tối ưu hóa quy trình thu gom và quản lý rác thải**, góp phần vào sự phát triển bền vững của đô thị.
          </Text>
        </View>

        {/* Phần Các tính năng chính */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Chúng tôi làm được gì?</Text>
        <View style={styles.featureItem}>
          <Ionicons name="people-outline" size={24} color={colors.primary} style={styles.featureIcon} />
          <View style={styles.featureTextContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Kết nối cộng đồng</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Ứng dụng là **cầu nối hiệu quả giữa tài xế gom rác và người gom rác**, tạo nên một mạng lưới thu gom liền mạch và minh bạch.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="navigate-outline" size={24} color={colors.primary} style={styles.featureIcon} />
          <View style={styles.featureTextContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Tự động hóa thông minh</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Hệ thống của chúng tôi tự động hóa việc **điều phối xe** và **tính toán tuyến đường** một cách tối ưu, giúp rút ngắn thời gian và chi phí vận hành.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="bar-chart-outline" size={24} color={colors.primary} style={styles.featureIcon} />
          <View style={styles.featureTextContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Minh bạch dữ liệu</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              [Tên Ứng Dụng Của Bạn] còn cung cấp tính năng **thống kê số lượng rác thải mỗi ngày**, mang lại cái nhìn tổng quan và minh bạch về lượng rác được thu gom, hỗ trợ các quyết định quản lý.
            </Text>
          </View>
        </View>

        {/* Phần Tầm nhìn */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Tầm nhìn của chúng tôi</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chúng tôi tin rằng với [Tên Ứng Dụng Của Bạn], việc quản lý rác thải sẽ trở nên dễ dàng, hiệu quả và bền vững hơn bao giờ hết. Hãy cùng chúng tôi xây dựng một tương lai xanh và sạch đẹp!
        </Text>

        {/* Liên kết khác (ví dụ: Chính sách bảo mật) */}
        <TouchableOpacity onPress={navigateToPrivacyPolicy} style={styles.linkRow}>
          <Ionicons name="document-text-outline" size={20} color={colors.subText} />
          <Text style={[styles.linkTextButton, { color: colors.text }]}>Chính sách bảo mật</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* Điều hướng đến trang Điều khoản dịch vụ */}} style={styles.linkRow}>
          <Ionicons name="reader-outline" size={20} color={colors.subText} />
          <Text style={[styles.linkTextButton, { color: colors.text }]}>Điều khoản dịch vụ</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </TouchableOpacity>
        
        <Text style={[styles.appVersion, { color: colors.subText }]}>
          Phiên bản: 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical:30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 15, // Tăng padding để dễ bấm
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80, // Đảm bảo đủ khoảng trống cho CustomTabBar
  },
  appIntro: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  appLogoIcon: {
    marginBottom: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 5,
  },
  appSlogan: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 15,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featureIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  featureTextContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF1', // Màu borderLight cố định hoặc dùng colors.borderLight
  },
  linkTextButton: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  appVersion: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});