import polyline from '@mapbox/polyline';
import axios from 'axios';

export function getDistanceInMeters(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const R = 6371000; // bán kính trái đất (m)
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // đơn vị mét
}


export async function getCoordinates(
    start: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
) {
    try {
        const apiKey = '5b3ce3597851110001cf6248fed2cd4609bf4466add139b1d39b785d';

        const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            {
                coordinates: [
                    [start.longitude, start.latitude],
                    [destination.longitude, destination.latitude],
                ],
            },
            {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        const geometry = response.data.routes[0].geometry;
        const decoded = polyline.decode(geometry); // [ [lat, lng], ... ]
        const coords = decoded.map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
        }));

        return coords;
    } catch (error: any) {
        console.error('getCoordinates error:', error?.response?.data || error.message);
        throw error?.response?.data?.message || 'Không thể lấy dữ liệu tuyến đường';
    }
}
