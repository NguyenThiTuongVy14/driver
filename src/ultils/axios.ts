import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = '192.168.16.100';
const port = 8080;

const axiosIntance = axios.create({
  // baseURL: `http://${url}:${port}/api/`, 
  baseURL: 'https://backend-springboot-latest.onrender.com/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosIntance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosIntance;
