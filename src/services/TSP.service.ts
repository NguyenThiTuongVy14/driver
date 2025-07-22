import axios from 'axios';

interface Point {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  status: string;
}

interface RouteResponse {
  distance: number; // meters
  duration: number; // seconds
  coordinates: { latitude: number; longitude: number }[];
}

interface DistanceMatrix {
  [key: string]: number; // key format: "fromId-toId"
}

class TSPRouteOptimizer {
  private apiKey = '5b3ce3597851110001cf6248fed2cd4609bf4466add139b1d39b785d';
  private distanceCache: DistanceMatrix = {};
  private readonly END_POINT = { id: -1, latitude: 10.00, longitude: 106.00 };

  /**
   * Lấy khoảng cách thực tế giữa hai điểm từ API
   */
  private async getRouteDistance(from: Point, to: Point): Promise<number> {
    const cacheKey = `${from.id}-${to.id}`;
    
    if (this.distanceCache[cacheKey]) {
      return this.distanceCache[cacheKey];
    }

    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          coordinates: [
            [from.longitude, from.latitude],
            [to.longitude, to.latitude]
          ]
        },
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const distance = response.data.routes[0].summary.distance; // meters
      this.distanceCache[cacheKey] = distance;
      return distance;
    } catch (error) {
      console.error('Error fetching route distance:', error);
      // Fallback to haversine distance if API fails
      return this.calculateHaversineDistance(from, to);
    }
  }

  /**
   * Tính khoảng cách đường chim bay (dự phòng khi API lỗi)
   */
  private calculateHaversineDistance(from: Point, to: Point): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 + 
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Tạo ma trận khoảng cách giữa tất cả các điểm
   */
  private async buildDistanceMatrix(
    currentLocation: { latitude: number; longitude: number },
    points: Point[]
  ): Promise<DistanceMatrix> {
    const startPoint: Point = {
      id: 0,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      name: 'Current Location',
      address: '',
      status: ''
    };

    const endPoint: Point = {
      id: -1,
      latitude: this.END_POINT.latitude,
      longitude: this.END_POINT.longitude,
      name: 'End Point',
      address: '',
      status: ''
    };

    const allPoints = [startPoint, ...points, endPoint];
    const matrix: DistanceMatrix = {};

    // Tạo promises cho tất cả các cặp điểm
    const promises: Promise<void>[] = [];

    for (let i = 0; i < allPoints.length; i++) {
      for (let j = 0; j < allPoints.length; j++) {
        if (i !== j) {
          const from = allPoints[i];
          const to = allPoints[j];
          
          promises.push(
            this.getRouteDistance(from, to).then(distance => {
              matrix[`${from.id}-${to.id}`] = distance;
            })
          );
        }
      }
    }

    await Promise.all(promises);
    return matrix;
  }

  /**
   * Thuật toán Nearest Neighbor với cải tiến 2-opt
   */
  private solveNearestNeighbor(
    startId: number,
    endId: number,
    points: Point[],
    distanceMatrix: DistanceMatrix
  ): number[] {
    const unvisited = new Set(points.map(p => p.id));
    const route: number[] = [startId];
    let currentId = startId;

    // Tham lam: chọn điểm gần nhất chưa thăm
    while (unvisited.size > 0) {
      let nearestId = -1;
      let minDistance = Infinity;

      for (const pointId of unvisited) {
        const distance = distanceMatrix[`${currentId}-${pointId}`];
        if (distance < minDistance) {
          minDistance = distance;
          nearestId = pointId;
        }
      }

      if (nearestId !== -1) {
        route.push(nearestId);
        unvisited.delete(nearestId);
        currentId = nearestId;
      } else {
        break;
      }
    }

    route.push(endId);
    return route;
  }

  /**
   * Cải tiến đường đi bằng thuật toán 2-opt
   */
  private improve2Opt(route: number[], distanceMatrix: DistanceMatrix): number[] {
    const n = route.length;
    let improved = true;
    let bestRoute = [...route];

    while (improved) {
      improved = false;
      
      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
          // Tính khoảng cách hiện tại
          const currentDist = 
            distanceMatrix[`${bestRoute[i-1]}-${bestRoute[i]}`] +
            distanceMatrix[`${bestRoute[j]}-${bestRoute[j+1]}`];
          
          // Tính khoảng cách sau khi đổi
          const newDist = 
            distanceMatrix[`${bestRoute[i-1]}-${bestRoute[j]}`] +
            distanceMatrix[`${bestRoute[i]}-${bestRoute[j+1]}`];
          
          if (newDist < currentDist) {
            // Đảo ngược đoạn từ i đến j
            const newRoute = [...bestRoute];
            newRoute.splice(i, j - i + 1, ...bestRoute.slice(i, j + 1).reverse());
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * Tính tổng khoảng cách của một đường đi
   */
  private calculateTotalDistance(route: number[], distanceMatrix: DistanceMatrix): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[`${route[i]}-${route[i + 1]}`];
    }
    return totalDistance;
  }

  /**
   * Hàm chính để tối ưu hóa đường đi
   */
  public async optimizeRoute(
    currentLocation: { latitude: number; longitude: number },
    points: Point[]
  ): Promise<{
    optimizedRoute: Point[];
    totalDistance: number;
    totalDuration: number;
  }> {
    console.log('🚀 Bắt đầu tối ưu hóa đường đi...');
    
    // Bước 1: Tạo ma trận khoảng cách
    console.log('📊 Đang tạo ma trận khoảng cách...');
    const distanceMatrix = await this.buildDistanceMatrix(currentLocation, points);
    
    // Bước 2: Tìm đường đi tối ưu bằng Nearest Neighbor
    console.log('🔍 Đang tìm đường đi tối ưu...');
    const initialRoute = this.solveNearestNeighbor(0, -1, points, distanceMatrix);
    
    // Bước 3: Cải tiến bằng 2-opt
    console.log('⚡ Đang cải tiến đường đi...');
    const optimizedRoute = this.improve2Opt(initialRoute, distanceMatrix);
    
    // Bước 4: Tính tổng khoảng cách
    const totalDistance = this.calculateTotalDistance(optimizedRoute, distanceMatrix);
    
    // Bước 5: Tạo kết quả cuối cùng
    const startPoint: Point = {
      id: 0,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      name: 'Vị trí hiện tại',
      address: 'Điểm bắt đầu',
      status: 'START'
    };
    
    const endPoint: Point = {
      id: -1,
      latitude: this.END_POINT.latitude,
      longitude: this.END_POINT.longitude,
      name: 'Điểm kết thúc',
      address: 'Điểm cuối (11.00, 106.00)',
      status: 'END'
    };
    
    const result: Point[] = [];
    
    for (const pointId of optimizedRoute) {
      if (pointId === 0) {
        result.push(startPoint);
      } else if (pointId === -1) {
        result.push(endPoint);
      } else {
        const point = points.find(p => p.id === pointId);
        if (point) {
          result.push(point);
        }
      }
    }
    
    console.log('✅ Tối ưu hóa hoàn tất!');
    console.log(`📏 Tổng khoảng cách: ${(totalDistance / 1000).toFixed(2)} km`);
    console.log(`🗺️ Thứ tự đi: ${optimizedRoute.join(' → ')}`);
    
    return {
      optimizedRoute: result,
      totalDistance,
      totalDuration: Math.round(totalDistance / 1000 * 60) // Ước tính: 1km = 1 phút
    };
  }
}

export default TSPRouteOptimizer;