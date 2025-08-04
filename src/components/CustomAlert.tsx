import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
  message: string;
  type: string;
  isVisible: boolean;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, type, isVisible, onClose }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current; // For swipe animation

  useEffect(() => {
    if (isVisible) {
      // Reset swipe position when showing
      translateXAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 10,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 10,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (type === 'success' || type === 'error') {
          const timer = setTimeout(() => {
            hideAlert();
          }, 3000);
          return () => clearTimeout(timer);
        }
      });
    } else {
      hideAlert();
    }
  }, [isVisible]);

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Chỉ bắt đầu pan khi vuốt ngang đủ xa
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // Đặt offset để animation mượt hơn
        translateXAnim.setOffset(translateXAnim._value);
        translateXAnim.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Cập nhật vị trí theo cử chỉ vuốt
        translateXAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Xóa offset
        translateXAnim.flattenOffset();
        
        const { dx, vx } = gestureState;
        
        // Nếu vuốt đủ xa (> 100px) hoặc vuốt nhanh (velocity > 0.5)
        if (Math.abs(dx) > 100 || Math.abs(vx) > 0.5) {
          // Animate slide out theo hướng vuốt
          const toValue = dx > 0 ? width : -width;
          Animated.parallel([
            Animated.timing(translateXAnim, {
              toValue,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
          });
        } else {
          // Trở về vị trí ban đầu
          Animated.spring(translateXAnim, {
            toValue: 0,
            damping: 15,
            stiffness: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isVisible && fadeAnim.__getValue() === 0 && slideAnim.__getValue() === -100 && scaleAnim.__getValue() === 0.9) {
    return null;
  }

  const alertColors = {
    success: {
      background: '#e6ffed',
      border: '#6fcf97',
      icon: '#27ae60',
      text: '#218838',
    },
    error: {
      background: '#ffe6e6',
      border: '#eb5757',
      icon: '#eb5757',
      text: '#c0392b',
    },
  };

  const currentColors = alertColors[type];
  const iconName = type === 'success' ? 'checkmark-circle' : 'close-circle';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.alertContainer,
        {
          backgroundColor: currentColors.background,
          borderColor: currentColors.border,
          top: insets.top + 10,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim }, 
            { scale: scaleAnim },
            { translateX: translateXAnim }
          ],
        },
      ]}
    >
      <Ionicons name={iconName} size={26} color={currentColors.icon} style={styles.alertIcon} />
      <Text style={[styles.alertText, { color: currentColors.text }]}>{message}</Text>
      <TouchableOpacity onPress={hideAlert} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        {/* <Ionicons name="close" size={22} color={currentColors.text} /> */}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 15, 
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 15,
    padding: 2, 
  },
});

export default CustomAlert;