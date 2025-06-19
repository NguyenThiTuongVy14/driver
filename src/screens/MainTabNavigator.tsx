import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingScreen from '../screens/SettingScreen';
import { useAppColors } from '../hooks/useAppColors';

const { width } = Dimensions.get('window');
const TAB_COUNT = 3;
const TAB_WIDTH = width / TAB_COUNT;

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const translateYAnim = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();

    state.routes.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(scaleAnim[i], {
          toValue: i === state.index ? 1.15 : 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim[i], {
          toValue: i === state.index ? -10 : 0,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
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
        const iconName =
          route.name === 'Home'
            ? 'home-outline'
            : route.name === 'Setting'
            ? 'settings-outline'
            : 'notifications-outline';

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableWithoutFeedback key={route.key} onPress={onPress}>
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
              />
              <Text
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  fontWeight: isFocused ? '600' : 'normal',
                }}
              >
                {options.title ?? route.name}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
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
      <Tab.Screen name="Setting" component={SettingScreen} options={{ title: 'Cài đặt' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Notification" component={SettingScreen} options={{ title: 'Thông báo' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 72,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    elevation: 20,
    zIndex: -1,
  },
  tabItem: {
    width: TAB_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
