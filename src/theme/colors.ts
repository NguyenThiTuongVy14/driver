// theme/colors.ts
export const lightColors = {
  background: '#f0f4f8',
  card: '#ffffff',
  text: '#2d3436',
  subText: '#636e72',
  border: '#e0e6ed',
  dateBg: '#ffffff',
  dateText: '#2d3436',
  statusBox: '#E8F5E9',
  statusText: '#1e293b',
  infoBg: '#E8F5E9',
  button: '#81C784',
};

export const darkColors = {
  background: '#1e1e1e',
  card: '#2c2c2e',
  text: '#f1f1f1',
  subText: '#c4c4c4',
  border: '#3a3a3c',
  dateBg: '#3c3c3e',
  dateText: '#e0e0e0',
  statusBox: '#333',
  statusText: '#fff',
  infoBg: '#2a2a2a',
  button: '#4CAF50',
};

export const getColors = (theme: 'light' | 'dark') =>
  theme === 'dark' ? darkColors : lightColors;
