import apiClient from '../ultils/axios';

export async function 
getNotifications() {
  try {
    const response = await apiClient.get('/notifications');
    console.log('[✅] API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.warn('[⚠️] Gọi API thất bại, trả về dữ liệu giả:', error.message);
    return [
      {
        id: '1',
        content: 'Bạn có đơn hàng mới!',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        content: 'Đơn hàng #1234 đã được xác nhận',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        content: 'Chào mừng bạn đến với ứng dụng của chúng tôi!',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}


export async function updateNotificationRead(notificationId: number) {
  try {
    const response = await apiClient.post(`/notifications/${notificationId}/read`, {});
    if (!response) throw new Error('Failed to update notification');
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
}
