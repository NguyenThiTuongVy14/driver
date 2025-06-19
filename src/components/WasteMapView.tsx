import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface WastePoint {
  id: number;
  latitude: number;
  longitude: number;
  status: 'completed' | 'ready' | 'pending';
  address: string;
  weight: string;
  time: string;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  wastePoints: WastePoint[];
  routeCoordinates: RouteCoordinate[];
  animatedValue: Animated.Value;
  handlePointPress: (point: WastePoint) => void;
  getPointColor: (status: 'ready' | 'completed' | 'pending') => string;
  currentLocation?: { latitude: number; longitude: number };
  selectedPoint?: WastePoint | null;
}

const WasteMapView: React.FC<MapViewProps> = ({
  wastePoints,
  routeCoordinates,
  animatedValue,
  handlePointPress,
  getPointColor,
  currentLocation,
  selectedPoint,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const defaultRegion = {
    latitude: 10.8231,
    longitude: 106.6297,
    latitudeDelta: 0.09,
    longitudeDelta: 0.04,
  };

  useEffect(() => {
    if (wastePoints.length > 0 && mapRef.current) {
      const coords = wastePoints.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));
      if (currentLocation) coords.push(currentLocation);
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [wastePoints, currentLocation]);

  useEffect(() => {
    if (selectedPoint && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [selectedPoint]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={defaultRegion}
    >
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#007AFF"
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
      )}

      {wastePoints.map(p => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          onPress={() => handlePointPress(p)}
        >
          <View
            style={{
              backgroundColor: getPointColor(p.status),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>#{p.id}</Text>
          </View>
        </Marker>
      ))}

      {currentLocation && (
        <Marker coordinate={currentLocation}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.4],
                  }),
                },
              ],
            }}
          >
            <View style={styles.currentMarker}>
              <Text style={styles.currentText}>Tôi</Text>
            </View>
          </Animated.View>
        </Marker>
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  currentMarker: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WasteMapView;
