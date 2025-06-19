import { useTheme } from '../theme/ThemeContext';

export const useAppColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    colors: {
      background: isDark ? '#1e1e1e' : '#f0f4f8',
      card: isDark ? '#2c2c2e' : '#ffffff',
      text: isDark ? '#f1f1f1' : '#2d3436',
      subText: isDark ? '#c4c4c4' : '#636e72',
      border: isDark ? '#3a3a3c' : '#e0e6ed',
      dateBg: isDark ? '#3c3c3e' : '#ffffff',
      dateText: isDark ? '#e0e0e0' : '#2d3436',
      primary: isDark ? '#3498db' : '#2980b9',
      danger: isDark ? '#e74c3c' : '#c0392b',
      success: isDark ? '#2ecc71' : '#27ae60',
    },
  };
};
