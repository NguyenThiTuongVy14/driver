import React, { useRef, useEffect } from 'react';
import { Platform, Text, Animated, Image } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Callout,
} from 'react-native-maps';

interface WastePoint {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  shift: string;
}

interface ExtraMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  iconColor?: string;
}

interface MapViewProps {
  wastePoints: WastePoint[];
  animatedValue: Animated.Value;
  handlePointPress: (point: WastePoint) => void;
  getPointColor: (status: string) => string;
  currentLocation?: { latitude: number; longitude: number };
  selectedPoint: WastePoint | null;
  routeCoordinates: { latitude: number; longitude: number }[];
  currentLocationIcon: string;
  extraMarkers?: ExtraMarker[]; // 👈 THÊM props mới
}

const WasteMapView: React.FC<MapViewProps> = ({
  wastePoints,
  animatedValue,
  handlePointPress,
  getPointColor,
  currentLocation,
  selectedPoint,
  routeCoordinates,
  currentLocationIcon,
  extraMarkers = [], // 👈 Default rỗng nếu không truyền
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      let targetLocation = null;
      let delta = 0.05;

      if (selectedPoint) {
        targetLocation = {
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
        };
        delta = 0.01;
      } else if (currentLocation) {
        targetLocation = currentLocation;
        delta = 0.05;
      }

      if (targetLocation) {
        mapRef.current.animateToRegion(
          {
            latitude: targetLocation.latitude,
            longitude: targetLocation.longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          },
          1000
        );
      }
    }
  }, [selectedPoint, currentLocation]);

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: currentLocation?.latitude || 10.762622,
        longitude: currentLocation?.longitude || 106.660172,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* 🔵 Vẽ tuyến đường nếu có */}
      {selectedPoint && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#007AFF"
          strokeWidth={4}
        />
      )}

      {/* 🗑️ Điểm thu gom */}
      {wastePoints.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          pinColor={getPointColor(p.status)}
          onPress={() => handlePointPress(p)}
        >
          <Callout>
            <Text style={{ fontWeight: 'bold' }}>#{p.id}</Text>
            <Text>{p.address}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Trạng thái: {p.status}
            </Text>
          </Callout>
        </Marker>
      ))}

      {/* 🧭 Vị trí hiện tại */}
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
        >
          <Image
            source={{ uri: currentLocationIcon }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#000000',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3,
              padding: 0,
              zIndex: 100,
            }}
            resizeMode="cover"
            onError={(e) =>
              console.error('Lỗi tải ảnh vị trí hiện tại:', e.nativeEvent.error)
            }
          />
        </Marker>
      )}

      {/* 🟢🔴 Điểm bắt đầu / kết thúc thêm từ ngoài */}
      {extraMarkers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          pinColor={marker.iconColor || 'gray'}
          title={marker.title}
        />
      ))}
    </MapView>
  );
};

export default WasteMapView;
