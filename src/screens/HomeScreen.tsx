import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import WasteMapView from '../components/WasteMapView';
import { useAppColors } from '../hooks/useAppColors';
import { fetchTasks, getStatus, getShift } from '../services/task';
import * as Location from 'expo-location';

interface WastePoint {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  shift: string;
}

const HomeScreen = () => {
  const { colors } = useAppColors();
  const animatedValue = useRef(new Animated.Value(10000)).current;
  const [selectedPoint, setSelectedPoint] = useState<WastePoint | null>(null);
  const [tasks, setTasks] = useState<WastePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 0, longitude: 0 });

  // Lấy vị trí thật với expo-location
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Quyền truy cập vị trí bị từ chối');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    getLocation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await fetchTasks();
        const mapped: WastePoint[] = rawData.map((item: any) => ({
          id: item.id,
          latitude: item.position.lat,
          longitude: item.position.lng,
          status: item.status,
          address: item.position.address,
          shift: item.shift?.name ?? getShift(item.shift?.id).label,
        }));
        setTasks(mapped);
      } catch (err) {
        console.error('Lỗi lấy task:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePointPress = (p: WastePoint) => {
    setSelectedPoint(p);
  };

  const getPointColor = (status: string) =>
    ({
      ASSIGNED: colors.primary,
      LATE: colors.danger,
      COMPLETED: colors.success,
    }[status] || colors.subText);

  const routeCoordinates = tasks.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <WasteMapView
          wastePoints={tasks}
          routeCoordinates={routeCoordinates}
          animatedValue={animatedValue}
          handlePointPress={handlePointPress}
          getPointColor={getPointColor}
          currentLocation={currentLocation}
          selectedPoint={selectedPoint}
        />
      </View>

      <View style={styles.taskListContainer}>
        <Text style={[styles.title, { color: colors.text }]}>📋 Các điểm đã được phân công</Text>
        {loading ? (
          <Text style={{ color: colors.subText }}>Đang tải dữ liệu...</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={i => i.id.toString()}
            renderItem={({ item }) => {
              const statusObj = getStatus(item.status);
              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderLeftColor: statusObj.color,
                    },
                  ]}
                  onPress={() => handlePointPress(item)}
                >
                  <Text style={[styles.address, { color: colors.text }]}>{item.address}</Text>
                  <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color: statusObj.color }]}>
                      {statusObj.label}
                    </Text>
                    <Text style={[styles.dot]}>•</Text>
                    <Text style={{ color: colors.subText }}>{item.shift}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 90,
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dot: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 4,
  },
});

export default HomeScreen;
