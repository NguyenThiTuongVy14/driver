import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

const { width } = Dimensions.get('window');

interface CustomAlertProps {
  message: string;
  type: string;
  isVisible: boolean;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, type, isVisible, onClose }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current; // For a subtle pop effect

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 10, // Controls oscillations
          stiffness: 100, // Controls speed
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, { // Scale in
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
      // Hide animation when isVisible becomes false externally
      hideAlert();
    }
  }, [isVisible]); // Removed fadeAnim, slideAnim, scaleAnim from dependency array to prevent unnecessary re-runs

  const hideAlert = () => {
    // Hide animation: Slide out, fade out, and subtly scale down
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
      onClose(); // Call onClose after animation completes to fully unmount
    });
  };

  // Only render if `isVisible` is true or if `fadeAnim` is still animating out.
  // This prevents flickering when the component unmounts quickly.
  if (!isVisible && fadeAnim.__getValue() === 0 && slideAnim.__getValue() === -100 && scaleAnim.__getValue() === 0.9) {
    return null;
  }

  const alertColors = {
    success: {
      background: '#e6ffed', // Lighter green
      border: '#6fcf97',     // A bit darker border for definition
      icon: '#27ae60',       // Vibrant green for icon
      text: '#218838',       // Darker green for text
    },
    error: {
      background: '#ffe6e6', // Lighter red
      border: '#eb5757',     // A bit darker border for definition
      icon: '#eb5757',       // Vibrant red for icon
      text: '#c0392b',       // Darker red for text
    },
  };

  const currentColors = alertColors[type];
  const iconName = type === 'success' ? 'checkmark-circle' : 'close-circle';

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          backgroundColor: currentColors.background,
          borderColor: currentColors.border,
          top: insets.top + 10, // Position based on safe area
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Ionicons name={iconName} size={26} color={currentColors.icon} style={styles.alertIcon} />
      <Text style={[styles.alertText, { color: currentColors.text }]}>{message}</Text>
      <TouchableOpacity onPress={hideAlert} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={22} color={currentColors.text} />
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
    borderRadius: 10, // Slightly more rounded corners
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8, // Increased elevation for Android shadow
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