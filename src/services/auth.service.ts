import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../ultils/axios';
import { saveToken, removeToken } from '../ultils/storage';
import { fcmService } from '../services/firebase.service'

export async function login(username: string, password: string, role=2) {
  try {
    const fcmToken = await fcmService.getFCMToken();
    const response = await apiClient.post('/auth/login', {
      username,
      password,
      role,
      fcmToken
    });
    console.log(response.data)
    await saveToken(response.data['token']);
    return response.data['token'];
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi đăng nhập';
  }
}


export async function register(data: FormData) {
  try {
    console.log(11111)
    const response = await fetch('http://192.168.61.221:8080/api/register/driver', {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log(response)
    return response

  } catch (error: any) {
    console.error('API Error:', error.message || error);
  }
}



export async function forgotPassword(username: string) {
  try {
    
    const response = await apiClient.post('/auth/forgot-password', {
      username,
    });
    console.log(response.data)
    return response;
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi lấy OTP quên mật khẩu';
  }
}

export async function resetPassword(username: string, otp:string, newPassword: string) {
  try {
    
    const response = await apiClient.post('/auth/reset-password', {
      username,
      otp,
      newPassword
    });
    console.log(response.data)
    return response;
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi reset pass';
  }
}



export async function logout() {
  try {
    const fcmToken = await fcmService.getFCMToken(); // Lưu trước khi xoá
    await fcmService.deleteFCMToken();               // Sau đó mới xoá
    await removeToken();
    const response = await apiClient.post('/auth/logout', { fcmToken });
    console.log(response.data)
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi đăng xuất';
  }

}
