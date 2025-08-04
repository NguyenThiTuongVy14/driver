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
      case 'PROCESSING':
      return {
        label: 'Đang thực hiện',
        color: '#e9e21bff',
        backgroundColor: 'rgba(255, 1, 1, 0.1)', // Fixed backgroundColor
        borderColor: '#faf639ff',
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
    // return 
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

export async function registers(data: any) {
  try {
    const response = await apiClient.post('/job-rotations/driver/register-shift', data);
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
const datafake = {
    "routes": [
        {
            "jobRotationId": null,
            "position": {
                "id": 999,
                "name": "Công ty vận tải xanh Chi nhánh Q8",
                "address": "Trường Đại học Công nghệ Sài Gòn, 180, Cao Lỗ, Phường Chánh Hưng, Thành phố Hồ Chí Minh, Chợ Lớn, 73009, Việt Nam",
                "status": null,
                "lat": 10.74,
                "lng": 106.68,
                "createdAt": null,
                "index": 1,
                "arrival": 0,
                "type": "start"
            },
            "status": null
        },
        {
            "jobRotationId": null,
            "position": {
                "id": 3,
                "name": "Bãi tập kết rác số 3",
                "address": "273 An Dương Vương, phường 3, Quận 5, TP. Hồ Chí Minh",
                "status": null,
                "lat": 10.76,
                "lng": 106.68,
                "createdAt": null,
                "index": 2,
                "arrival": 352,
                "type": "job"
            },
            "status": "COMPLETED"
        },
        {
            "jobRotationId": null,
            "position": {
                "id": 4,
                "name": "Bãi tập kết rác số 4",
                "address": "180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh",
                "status": null,
                "lat": 10.73,
                "lng": 106.68,
                "createdAt": null,
                "index": 3,
                "arrival": 840,
                "type": "job"
            },
            "status": "PROCESSING"
        },
        {
            "jobRotationId": null,
            "position": {
                "id": 1000,
                "name": "Bãi rác Đông Thạnh",
                "address": "Bãi rác Đông Thạnh, Xã Đông Thạnh, Huyện Hóc Môn, Thành phố Hồ Chí Minh, Việt Nam",
                "status": null,
                "lat": 10.90,
                "lng": 106.63,
                "createdAt": null,
                "index": 4,
                "arrival": 2955,
                "type": "end"
            },
            "status": null
        }
    ],
    "message": "Tối ưu hóa lộ trình thành công",
    "vehicle": {
        "id": 4,
        "licensePlate": "70C-111.22",
        "tonnage": 12.00,
        "status": "IN_USE",
        "image": "https://cdn.vjshop.vn/tin-tuc/chup-anh-o-to/chup-anh-o-to-4.jpg",
        "remainingTonnage": 0.00,
        "currentTonnage": 0.00
    }
}


