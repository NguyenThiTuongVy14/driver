import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ErrorMessage = ({ message, onHide }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide(); 
        });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.text}>⚠️ {message}</Text>
    </Animated.View>
  );
};

export default ErrorMessage;

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 80,
    left: SCREEN_WIDTH * 0.05,
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#ffe6e6',
    borderLeftWidth: 6,
    borderLeftColor: '#e74c3c',
    borderRadius: 10,
    padding: 20,
    zIndex: 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  text: {
    color: '#c0392b',
    fontWeight: '500',
    fontSize: 14,
  },
});
