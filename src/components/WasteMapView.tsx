import React, { useRef, useEffect, useState } from 'react';
import {
  Platform,
  Text,
  Animated,
  Image,
  View,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
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
  name?: string; // Thêm tên địa điểm
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
  handlePointPress: (point: WastePoint | null) => void; // null để bỏ chọn
  getPointColor: (status: string) => string;
  currentLocation?: { latitude: number; longitude: number };
  selectedPoint: WastePoint | null;
  routeCoordinates: { latitude: number; longitude: number }[];
  currentLocationIcon: string;
  extraMarkers?: ExtraMarker[];
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
  extraMarkers = [],
}) => {
  const mapRef = useRef<MapView>(null);
  const [cardVisible, setCardVisible] = useState(true);
  const cardTranslateX = useRef(new Animated.Value(0)).current;

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

  // Reset card visibility khi có selectedPoint mới
  useEffect(() => {
    if (selectedPoint) {
      setCardVisible(true);
      cardTranslateX.setValue(0);
    }
  }, [selectedPoint, cardTranslateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        cardTranslateX.setOffset(cardTranslateX._value);
        cardTranslateX.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: cardTranslateX }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        cardTranslateX.flattenOffset();
        
        // Nếu vuốt quá 100px hoặc vuốt nhanh sang phải thì ẩn card
        if (gestureState.dx > 100 || gestureState.vx > 0.5) {
          Animated.timing(cardTranslateX, {
            toValue: 400, // Vuốt ra ngoài màn hình
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            setCardVisible(false);
          });
        } else {
          // Nếu không đủ điều kiện thì trở về vị trí ban đầu
          Animated.spring(cardTranslateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }}>
      {/* 🟨 Card nổi hiển thị selectedPoint */}
      {selectedPoint && cardVisible && (
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            top: 40,
            left: 20,
            right: 20,
            backgroundColor: 'white',
            padding:20,
            borderRadius: 10,
            elevation: 5,
            zIndex: 999,
            transform: [{ translateX: cardTranslateX }],
          }}
        >
          {/* Indicator để biết có thể vuốt
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: '#ccc',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 10,
            }}
          /> */}

          {/* Tên địa điểm */}
          {selectedPoint.name && (
            <Text style={{ 
              fontWeight: 'bold', 
              fontSize: 18, 
              marginBottom: 4,
              color: '#333'
            }}>
              {selectedPoint.name}
            </Text>
          )}

          {/* Địa chỉ */}
          <Text style={{ 
            fontSize: 14, 
            color: '#666',
            marginBottom: 8
          }}>
            {selectedPoint.address}
          </Text>

          {/* Trạng thái */}
          <Text style={{ 
            fontSize: 12, 
            color: '#999',
            fontStyle: 'italic'
          }}>
            {/* Trạng thái: {selectedPoint.status} • Ca: {selectedPoint.shift} */}
          </Text>

          {/* Hint text */}
          
        </Animated.View>
      )}

      {/* 🗺️ Map */}
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
        {/* 🔵 Vẽ tuyến đường */}
        {selectedPoint && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}

        {/* 🗑️ Các điểm thu gom */}
        {wastePoints.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            pinColor={getPointColor(p.status)}
            onPress={() => handlePointPress(p)}
          >
            <Callout tooltip={true}>
              <View
                style={{
                  backgroundColor: 'white',
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                {p.name && (
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {p.name}
                  </Text>
                )}
                <Text style={{ fontSize: 12 }}>{p.address}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Trạng thái: {p.status}
                </Text>
                <TouchableOpacity onPress={() => handlePointPress(p)}>
                  <Text style={{ color: 'blue', marginTop: 5 }}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>
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
                zIndex: 100,
              }}
              resizeMode="cover"
              onError={(e) =>
                console.error(
                  'Lỗi tải ảnh vị trí hiện tại:',
                  e.nativeEvent.error
                )
              }
            />
          </Marker>
        )}

        {/* 🟢🔴 Marker phụ */}
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
    </View>
  );
};

export default WasteMapView;