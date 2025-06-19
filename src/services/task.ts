import apiClient from '../ultils/axios';

export function getStatus(status: string) {
  switch (status) {
    case 'ASSIGNED':
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
        backgroundColor: 'rgba(47, 211, 47, 0.1)',
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

export async function fetchTasks(date: string = new Date().toISOString().split('T')[0]) {
  console.log('🔄 Fetching tasks for date:', date);

  try {
    const response = await apiClient.get(`/job-rotations/me?date=${date}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching tasks:', error);
    throw error;
  }
}

export async function updateTaskStatus(jobRotationId: number) {
  const body = { jobRotationId };
  const response = await apiClient.post('/collection-points/collector/mark-completed', body);
  return response.data;
}
