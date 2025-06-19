import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
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
export function getShift(shift: Int32) {
    switch (shift) {
        case 1:
            return {
                label: 'Ca Sáng',
                color: '#FFA000',
                backgroundColor: 'rgba(255, 160, 0, 0.1)',
                borderColor: '#FFA000',
            };
        case 2:
            return {
                label: 'Ca Trưa',
                color: '#F57C00',
                backgroundColor: 'rgba(245, 124, 0, 0.1)',
                borderColor: '#F57C00',
            };
        case 3:
            return {
                label: 'Ca Chiều',
                color: '#1976D2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                borderColor: '#1976D2',
            };
        case 4:
            return {
                label: 'Ca Tối',
                color: '#512DA8',
                backgroundColor: 'rgba(81, 45, 168, 0.1)',
                borderColor: '#512DA8',
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



export async function fetchTasks(date) {
    console.log(date)
    const response = await apiClient.get(`/job-rotations/me?date=${date}`);
    console.log(response.data)
    return response.data
}

export async function updateTaskStatus(jobRotationId) {
    
    const body = {
        jobRotationId: jobRotationId,
    };
    
    const response = await apiClient.post('/collection-points/collector/mark-completed', body);
  return response.data;
}

