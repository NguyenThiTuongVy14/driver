import apiClient from '../ultils/axios';
import { saveToken, removeToken } from '../ultils/storage';

export async function login(username: string, password: string) {
  try {
    
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    console.log(response.data)
    await saveToken(response.data['token']);
    return response.data['token'];
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi đăng nhập';
  }
}

export async function logout() {
  try {
    await removeToken()
  } catch (error: any) {
    throw error.response?.data?.message || 'Lỗi đăng nhập';
  }
}
