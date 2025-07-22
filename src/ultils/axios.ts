import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = 'http://192.168.1.44';
const port = 8080;
const axiosIntance = axios.create({
  baseURL: 'https://backend-springboot-latest.onrender.com/api',
  // baseURL : `${url}:${port}/api`,
  timeout: 50000,
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
