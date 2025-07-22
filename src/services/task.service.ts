import apiClient from '../ultils/axios';

export function getStatus(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Đã giao',
        color: '#1976D2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderColor: '#1976D2',
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        color: '#388E3C',
        backgroundColor: 'rgba(56, 142, 60, 0.1)',
        borderColor: '#388E3C',
      };
    case 'LATE':
      return {
        label: 'Trễ',
        color: '#D32F2F',
        backgroundColor: 'rgba(211, 47, 47, 0.1)', // Fixed backgroundColor
        borderColor: '#D32F2F',
      };
    
    default:
      return {
        label: 'Không rõ',
        color: '#9E9E9E',
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        borderColor: '#9E9E9E',
      };
  }
}

export function getShift(shiftId: number) {
  switch (shiftId) {
    case 1:
      return 'Ca Sáng';
    case 2:
      return 'Ca Trưa';
    case 3:
      return 'Ca Chiều';
    case 4:
      return 'Ca Tối';
    default:
      return 'Chưa rõ';
  }
}

export async function fetchTasks() {
  try {
    const response = await apiClient.get(`/job-rotations/driver/optimized-routes`);
    console.log(response.data)
    return response.data.routes || [];

  }
  catch (error: any) {
    if (error.response) {
      console.error("Response error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received. Request was:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }

}

export async function updateTaskStatus(jobRotationId: number) {
  const body = { jobRotationId };
  console.log(body)
  const response = await apiClient.post('/job-rotations/driver/completed', body);
  console.log(response);
  return response.data;
}

export async function getShifts() {
  const response = await apiClient.get('/shifts');
  return response.data;
}

export async function registers(data: any[]) {
  try {
    const response = await apiClient.post('/job-rotations/driver/register-shift', data);
    console.log(data)
    console.log("✅ Response:", response.data);
    return response.data;
  } catch (error: any) {
    const serverError =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      'Không thể gửi dữ liệu.';

    console.error("❌ API Error:", serverError);
    throw new Error(serverError);
  }
}



