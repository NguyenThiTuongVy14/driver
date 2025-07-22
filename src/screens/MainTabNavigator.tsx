import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback, // Đã giữ nguyên TouchableWithoutFeedback
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen'; // Đảm bảo đúng đường dẫn
import SettingScreen from '../screens/SettingScreen'; // Đảm bảo đúng đường dẫn
import { useAppColors } from '../hooks/useAppColors'; // Đảm bảo đúng đường dẫn
import { green } from 'react-native-reanimated/lib/typescript/Colors';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket'; // cập nhật đúng đường dẫn
import NotificationScreen from './NotificationScreen';
import RegisterWorkScreen from './RegisterWorkScreen';


const { width } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = width / TAB_COUNT;

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const translateYAnim = useRef(state.routes.map(() => new Animated.Value(0))).current;
  const prevIndexRef = useRef(state.index);
  const { colors } = useAppColors();

  useEffect(() => {
    if (prevIndexRef.current === state.index) return;

    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();

    state.routes.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(scaleAnim[i], {
          toValue: i === state.index ? 1.15 : 1,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }),
        Animated.spring(translateYAnim[i], {
          toValue: i === state.index ? -5 : 0,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }),
      ]).start();
    });

    prevIndexRef.current = state.index;
  }, [state.index]);

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.card }]}>
      <Animated.View
        style={[
          styles.slider,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const iconName =
          route.name === 'Home'
            ? 'home-outline'
            : route.name === 'Setting'
            ? 'settings-outline'
            : route.name === 'Notification'
            ? 'notifications-outline'
            : 'clipboard-outline';

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name); // Bỏ emit để tránh loop
          }
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.tabItem,
                {
                  transform: [
                    { scale: scaleAnim[index] },
                    { translateY: translateYAnim[index] },
                  ],
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? colors.primary : colors.subText}
              />
              <Text
                style={{
                  color: isFocused ? colors.primary : colors.subText,
                  fontSize: 12,
                  marginTop: 4,
                  fontWeight: isFocused ? '600' : 'normal',
                }}
              >
                {options.title ?? route.name}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Đảm bảo thứ tự các Tab.Screen khớp với logic iconName nếu cần */}
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Notification" component={NotificationScreen} options={{ title: 'Thông báo' }} />
      <Tab.Screen name="Setting" component={SettingScreen} options={{ title: 'Cài đặt' }} />
      <Tab.Screen
        name="RegisterWork"
        component={RegisterWorkScreen}
        options={{ title: 'Đăng ký' }}
      />

    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Cấu hình đổ bóng cho cả iOS (shadow properties) và Android (elevation)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Bóng đổ lên trên
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  slider: {
    position: 'absolute',
    left: TAB_WIDTH / 10,
    top: -11,
    width: (TAB_WIDTH / 5) * 4,
    height: (TAB_WIDTH / 3) + 18,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.15,
    elevation: 50,
    zIndex: -1,
  },
  tabItem: {
    width: TAB_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});