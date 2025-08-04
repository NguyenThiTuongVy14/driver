import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Text,
  Dimensions,
  StatusBar 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCoordinates, getDistanceInMeters } from '../services/map.service';
import { updateTaskStatus } from '../services/task.service';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function DirectionScreen({ route }: any) {
  const { destination, id_JobRotation, address } = route.params;

  // Refs
  const mapRef = useRef<MapView>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRouteUpdateRef = useRef<number>(0);
  const routeFetchAttemptRef = useRef<number>(0);

  // State
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isUpdatingRoute, setIsUpdatingRoute] = useState(false);
  const [routeError, setRouteError] = useState(false);

  // Memoized values
  const isCloseEnough = useMemo(() => distance < 20000, [distance]);
  
  const formattedDistance = useMemo(() => {
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  }, [distance]);

  const mapRegion = useMemo(() => ({
    latitude: currentLocation?.latitude || destination.latitude,
    longitude: currentLocation?.longitude || destination.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [currentLocation, destination]);

  // Optimized route fetching with rate limiting
  const fetchORSRoute = useCallback(async (from: { latitude: number; longitude: number }, force: boolean = false) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastRouteUpdateRef.current;
    const MIN_UPDATE_INTERVAL = 30000; // 30 seconds minimum between API calls
    
    // Skip if too soon and not forced
    if (!force && timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
      console.log('Skipping route update - too soon');
      return;
    }
    
    if (isUpdatingRoute) return;
    
    try {
      setIsUpdatingRoute(true);
      setRouteError(false);
      
      if (!from || !destination) return;
      
      console.log('Fetching route - attempt:', routeFetchAttemptRef.current + 1);
      
      const coords = await getCoordinates(from, destination);
      setRouteCoords(coords);
      lastRouteUpdateRef.current = now;
      routeFetchAttemptRef.current = 0; // Reset attempt counter on success
      
      // Calculate estimated time (assuming average speed of 30km/h in city)
      const totalDistance = distance / 1000; // km
      const estimatedMinutes = Math.round((totalDistance / 30) * 60);
      setEstimatedTime(estimatedMinutes > 0 ? `${estimatedMinutes} phút` : '< 1 phút');
      
    } catch (err: any) {
      console.error('Lỗi ORS:', err?.response?.data || err.message);
      routeFetchAttemptRef.current += 1;
      
      const errorMsg = err?.response?.data?.error || err.message || '';
      
      if (errorMsg.includes('Rate Limit')) {
        setRouteError(true);
        console.log('Rate limit hit, will retry later');
        // Don't show alert for rate limit, just log it
        
        // Schedule retry after longer delay
        setTimeout(() => {
          if (routeFetchAttemptRef.current < 3) {
            fetchORSRoute(from, true);
          }
        }, 60000); // Retry after 1 minute
        
      } else {
        setAlertMessage('Không thể tính toán đường đi. Sử dụng đường bay thẳng.');
        setAlertType('warning');
        setShowAlert(true);
        
        // Fallback: Create straight line route
        setRouteCoords([from, destination]);
      }
    } finally {
      setLoading(false);
      setIsUpdatingRoute(false);
    }
  }, [destination, distance, isUpdatingRoute]);

  // Smart route update with distance-based logic
  const debouncedRouteUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    if (routeUpdateTimeoutRef.current) {
      clearTimeout(routeUpdateTimeoutRef.current);
    }
    
    // Only update route if user moved significantly (more than 100m from last route update)
    const now = Date.now();
    const timeSinceLastUpdate = now - lastRouteUpdateRef.current;
    
    // Don't update route too frequently, especially if we hit rate limit
    if (routeError && timeSinceLastUpdate < 120000) { // 2 minutes if error
      return;
    }
    
    routeUpdateTimeoutRef.current = setTimeout(() => {
      // Only fetch new route if it's been a while or if we don't have a route yet
      if (routeCoords.length === 0 || timeSinceLastUpdate > 60000) { // 1 minute minimum
        fetchORSRoute(location);
      }
    }, 15000); // Wait 15 seconds before updating
  }, [fetchORSRoute, routeError, routeCoords.length]);

  // Location tracking effect
  useEffect(() => {
    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAlertMessage('Không có quyền truy cập vị trí. Vui lòng bật quyền truy cập.');
          setAlertType('error');
          setShowAlert(true);
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const initialPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setCurrentLocation(initialPos);
        
        // Initial route fetch with force=true
        await fetchORSRoute(initialPos, true);

        // Start watching position with reduced frequency
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Increased to 5 seconds to reduce API calls
            distanceInterval: 10, // Increased to 10m to reduce updates
          },
          async (locationUpdate) => {
            const updatedPos = {
              latitude: locationUpdate.coords.latitude,
              longitude: locationUpdate.coords.longitude,
            };
            
            setCurrentLocation(updatedPos);

            // Calculate distance
            const dist = await getDistanceInMeters(updatedPos, destination);
            setDistance(dist);
            
            // Only update route if we don't have one or if user moved significantly
            if (routeCoords.length === 0) {
              debouncedRouteUpdate(updatedPos);
            } else {
              // Very conservative route updates - only if moved a lot
              const timeSinceLastUpdate = Date.now() - lastRouteUpdateRef.current;
              if (timeSinceLastUpdate > 300000) { // Only every 5 minutes
                debouncedRouteUpdate(updatedPos);
              }
            }
          }
        );
        
      } catch (error) {
        setAlertMessage('Không lấy được vị trí hiện tại. Vui lòng thử lại.');
        setAlertType('error');
        setShowAlert(true);
        setLoading(false);
      }
    };

    startTracking();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }
    };
  }, [destination, fetchORSRoute, debouncedRouteUpdate]);

  // Handle task completion
  const handleComplete = useCallback(async () => {
    try {
      await updateTaskStatus(id_JobRotation);
      setAlertMessage('Đã hoàn thành công việc');
      setAlertType('success');
      setShowAlert(true);
    } catch (err) {
      setAlertMessage('Công việc chưa hoàn thành');
      setAlertType('error');
      setShowAlert(true);
    }
  }, [id_JobRotation]);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Location Info Card */}
      {!loading && (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{address}</Text>
            
          </View>
          
          <View style={styles.cardContent}>
           

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khoảng cách:</Text>
              <Text style={styles.infoValue}>{formattedDistance}</Text>
            </View>
            
            {estimatedTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thời gian dự kiến:</Text>
                <Text style={styles.infoValue}>{estimatedTime}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <Text style={[styles.infoValue, { 
                color: isCloseEnough ? '#4CAF50' : '#FF9800' 
              }]}>
                {isCloseEnough ? '✅ Đã đến nơi' : '🚛 Đang di chuyển'}
              </Text>
            </View>
            
            {/* <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Định tuyến:</Text>
              <Text style={[styles.infoValue, { 
                color: routeError ? '#FF5722' : '#4CAF50' 
              }]}>
                {routeError ? '⚠️ Đường thẳng' : '🛣️ Đã tối ưu'}
              </Text>
            </View> */}
          </View>
        </View>
      )}

      {/* Alert Component */}
      {showAlert && (
        <CustomAlert
          message={alertMessage}
          type={alertType}
          isVisible={showAlert}
          onClose={() => setShowAlert(false)}
        />
      )}

      {/* Map or Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={false} // We'll handle this with custom marker
          showsMyLocationButton={false}
          loadingEnabled={true}
          loadingIndicatorColor="#007AFF"
          moveOnMarkerPress={false}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker 
              coordinate={currentLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
            >
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationDot} />
              </View>
            </Marker>
          )}
          
          {/* Destination Marker */}
          <Marker 
            coordinate={destination} 
            title="Điểm đến" 
            pinColor="red"
            anchor={{ x: 0.5, y: 1 }}
          />
          
          {/* Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline 
              coordinates={routeCoords} 
              strokeWidth={4} 
              strokeColor="#007AFF"
              lineJoin="round"
              lineCap="round"
            />
          )}
        </MapView>
      )}

      {/* Complete Button */}
      {!loading && (
        <TouchableOpacity
          style={[
            styles.completeButton, 
            { 
              opacity: isCloseEnough ? 1 : 0.4,
              backgroundColor: isCloseEnough ? '#4CAF50' : '#007AFF'
            }
          ]}
          onPress={handleComplete}
          disabled={!isCloseEnough}
          activeOpacity={0.8}
        >
          <Text style={styles.completeText}>
            {isCloseEnough ? 'Hoàn thành' : 'Hoàn thành'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Info Card Styles
  infoCard: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  centerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  centerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  
  cardContent: {
    gap: 8,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  
  // Map Styles
  map: { 
    flex: 1,
    marginTop: 0,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Marker Styles
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  
  // Complete Button Styles
  completeButton: {
    position: 'absolute',
    bottom: 40,
    left: '15%',
    right: '15%',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  completeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});