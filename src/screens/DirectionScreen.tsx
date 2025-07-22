import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCoordinates, getDistanceInMeters } from '../services/map.service';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { updateTaskStatus } from '../services/task.service';
import CustomAlert from '../components/CustomAlert';

export default function DirectionScreen({ route }: any) {
  const { destination, id_JobRotation } = route.params;

  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const isCloseEnough = useMemo(() => distance < 20000, [distance]);

  const fetchORSRoute = async (from: { latitude: number; longitude: number }) => {
    try {
      if (!from || !destination) return;
      const coords = await getCoordinates(from, destination);
      setRouteCoords(coords);
    } catch (err: any) {
      console.error('Lỗi ORS:', err?.response?.data || err.message);
      setAlertMessage('Không thể tính toán đường đi. Vui lòng thử lại.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAlertMessage('Không có quyền truy cập vị trí. Vui lòng bật quyền truy cập.');
          setAlertType('error');
          setShowAlert(true); return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const initialPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(initialPos);
        await fetchORSRoute(initialPos);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (locationUpdate) => {
            const updatedPos = {
              latitude: locationUpdate.coords.latitude,
              longitude: locationUpdate.coords.longitude,
            };
            setCurrentLocation(updatedPos);

            const dist = await getDistanceInMeters(updatedPos, destination);
            setDistance(dist);
            console.log('Khoảng cách:', dist);
          }
        );
      } catch (error) {
        setAlertMessage('Không lấy được vị trí hiện tại. Vui lòng thử lại.');
        setAlertType('error');
        setShowAlert(true);
      }
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const handleComplete = async () => {
    try {
      console.log(id_JobRotation)
      await updateTaskStatus(id_JobRotation);
      setAlertMessage('Đã hoàn thành công việc');
      setAlertType('success');
      setShowAlert(true);
    } catch (err) {
      setAlertMessage('Công việc chưa hoàn thành');
      setAlertType('error');
      setShowAlert(true);
    }
  };

  return (
    <View style={styles.container}>
      {!loading && (
        <>
          <TouchableOpacity
            style={[styles.completeButton, { opacity: isCloseEnough ? 1 : 0.4 }]}
            onPress={handleComplete}
            disabled={!isCloseEnough}
          >
            <Text style={styles.completeText}>Hoàn thành</Text>
          </TouchableOpacity>

          <Text style={styles.distanceText}>📍 Còn cách: {Math.round(distance)}m</Text>
        </>
      )}
      {showAlert && (
        <CustomAlert
          message={alertMessage}
          type={alertType}
          isVisible={showAlert}
          onClose={() => setShowAlert(false)}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <MapView
          key={currentLocation?.latitude}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || destination.latitude,
            longitude: currentLocation?.longitude || destination.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {currentLocation && (
            <Marker coordinate={currentLocation}>
              {/* <View style={{ alignItems: 'center' }}>
                <Icon name="truck" size={40} color="#000000" />
              </View> */}
            </Marker>
          )}
          <Marker coordinate={destination} title="Điểm đến" pinColor="green" />
          <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#000000" />
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  completeButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#007AFF',
    width: '70%',
    marginLeft: '15%',
    paddingVertical: 20,
    borderRadius: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  completeText: {
    fontWeight: '800',
    color: '#fff',
  },
  distanceText: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: '#ffffffcc',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});
