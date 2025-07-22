import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import WasteMapView from '../components/WasteMapView';
import { useAppColors } from '../hooks/useAppColors';
import { fetchTasks, getStatus } from '../services/task.service';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomAlert from '../components/CustomAlert';
import axios from 'axios';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WastePoint {
  id: number;
  idRotation: number;
  idPosition: number;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  name: string;
  image?: string;
}

interface RouteCache {
  [key: string]: {
    coordinates: { latitude: number; longitude: number }[];
    fromLocation: { latitude: number; longitude: number };
    timestamp: number;
  };
}

const RADIUS_EARTH = 6371e3; // Earth radius in meters


async function fetchRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const apiKey = '5b3ce3597851110001cf6248fed2cd4609bf4466add139b1d39b785d';
  const response = await axios.post(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    { coordinates: [[from.lng, from.lat], [to.lng, to.lat]] },
    {
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.features[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
  );
}

const HomeScreen = () => {
  const { colors } = useAppColors();
  const navigation = useNavigation();
  const listHeight = useRef(new Animated.Value(150)).current;
  const animatedValue = useRef(new Animated.Value(100)).current;

  const [state, setState] = useState({
    tasks: [] as WastePoint[],
    selectedPoint: null as WastePoint | null,
    currentLocation: { latitude: 0, longitude: 0 },
    routeCache: {} as RouteCache,
    loading: true,
    isLoadingRoutes: false,
    isListExpanded: false,
    alert: { show: false, message: '', type: 'success' as 'success' | 'error' },
    distanceMatrix: [] as number[][]
  });

  const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));
  async function getDistanceMatrixFromORS(points: WastePoint[]): Promise<number[][]> {
    const coordinates = points.map(p => [p.longitude, p.latitude]); // ORS dùng [lng, lat]

    const body = {
      locations: coordinates,
      metrics: ['distance'],
      units: 'km',
    };

    try {
      const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': '5b3ce3597851110001cf6248fed2cd4609bf4466add139b1d39b785d',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('ORS API error');
      }

      const data = await response.json();
      return data.distances;
    } catch (err) {
      console.error('❌ Lỗi khi gọi ORS:', err);
      return [];
    }
  }

  const fetchTasksData = useCallback(async () => {
    try {
      const response = await fetchTasks();
      const mapped: WastePoint[] = response.map((item: any) => ({
        idRotation: item.jobRotationId,
        idPosition: item.position.id,
        latitude: item.position.lat,
        longitude: item.position.lng,
        status: 'PENDING',
        address: item.position.address,
        name: item.position.name,
        image: item.position.image,
        id: item.position.id,
      }));

      // const distanceMatrix = await getDistanceMatrixFromORS(mapped);
      // if (!distanceMatrix || distanceMatrix.length !== mapped.length) {
      //   updateState({
      //     alert: {
      //       show: true,
      //       message: 'Không thể tạo ma trận khoảng cách',
      //       type: 'error',
      //     },
      //   });
      //   return mapped;
      // }
      // mapped.forEach((point, i) => {
      //   console.log(`Từ ${point.name} đến các điểm khác:`);
      //   console.log(distanceMatrix[i]);
      // });
      const distanceMatrix: number[][] = [
        [0, 9.35, 5.23, 9.49, 3.89, 3.74],  // Bãi 3
        [9.09, 0, 13.61, 9.26, 6.17, 6.09], // Bãi 2
        [4.98, 13.13, 0, 12.19, 8.81, 8.03],// Bãi 4
        [9.96, 8.72, 12.32, 0, 9.48, 8],    // Bãi 5
        [3.98, 5.61, 7.98, 9.61, 0, 1.76],  // Bãi 6
        [3.04, 6.09, 7.64, 8.46, 2.21, 0],     // Bãi 7
      ];
      distanceMatrix.forEach((point, i) => {
        // console.log(`Từ ${point.name} đến các điểm khác:`);
        console.log(distanceMatrix[i]);
      });
      console.table(distanceMatrix)
      updateState({ tasks: mapped, distanceMatrix });
      return mapped;
    } catch (error) {
      updateState({
        alert: { show: true, message: 'Không lấy được danh sách công việc', type: 'error' },
      });
      return [];
    }
  }, []);


  const getCurrentLocation = useCallback(async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        status = (await Location.requestForegroundPermissionsAsync()).status;
        if (status !== 'granted') return null;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      updateState({ currentLocation: newLocation });
      return newLocation;
    } catch {
      const fallbackLocation = { latitude: 10.8231, longitude: 106.6297 };
      updateState({ currentLocation: fallbackLocation });
      return fallbackLocation;
    }
  }, []);

  const loadAllRoutes = async (points: WastePoint[], currentLoc: { latitude: number; longitude: number }) => {
    if (!currentLoc.latitude || !currentLoc.longitude) return;
    updateState({ isLoadingRoutes: true });
    const newCache: RouteCache = {};

    await Promise.allSettled(
      points.map(async (p) => {
        try {
          newCache[`route_${p.id}`] = {
            coordinates: await fetchRoute(
              { lat: currentLoc.latitude, lng: currentLoc.longitude },
              { lat: p.latitude, lng: p.longitude }
            ),
            fromLocation: currentLoc,
            timestamp: Date.now(),
          };
        } catch { }
      })
    );

    updateState({ routeCache: newCache, isLoadingRoutes: false });
  };


  useFocusEffect(useCallback(() => {
    updateState({ loading: true, selectedPoint: null });
    (async () => {
      const location = await getCurrentLocation();
      const tasks = await fetchTasksData();
      if (location && tasks.length > 0) await loadAllRoutes(tasks, location);
      updateState({ loading: false });
    })();
  }, [fetchTasksData, getCurrentLocation]));


  const handleSelectPoint = (p: WastePoint) => {
    updateState({ selectedPoint: p });
    if (!state.isListExpanded) toggleList();
  };

  const toggleList = () => {
    Animated.spring(listHeight, {
      toValue: state.isListExpanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    updateState({ isListExpanded: !state.isListExpanded });
  };

  const getRouteCoordinates = (id: number) => state.routeCache[`route_${id}`]?.coordinates || [];
  const getPointColor = (status: string) => ({
    PENDING: colors.primary,
    LATE: colors.danger,
    COMPLETED: colors.success,
    ACTIVE: colors.primary,
  }[status] || colors.subText);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WasteMapView
        wastePoints={state.tasks}
        animatedValue={animatedValue}
        handlePointPress={handleSelectPoint}
        getPointColor={getPointColor}
        currentLocation={state.currentLocation}
        selectedPoint={state.selectedPoint}
        currentLocationIcon="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyzTWQoCUbRNdiyorem5Qp1zYYhpliR9q0Bw&s"
        routeCoordinates={state.selectedPoint ? getRouteCoordinates(state.selectedPoint.id) : []}
      />
      {state.alert.show && (
        <CustomAlert message={state.alert.message} type={state.alert.type} isVisible={state.alert.show} onClose={() => updateState({ alert: { ...state.alert, show: false } })} />
      )}
      <Animated.View style={[styles.taskListContainer, { backgroundColor: colors.card, height: listHeight }]}>
        <TouchableOpacity style={styles.headerContainer} onPress={toggleList} activeOpacity={0.7}>
          <View style={styles.handleBar} />
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              📋 Các điểm thu gom ({state.tasks.length})
              {state.isLoadingRoutes && ' (Đang tải routes...)'}
            </Text>
            <Text style={[styles.toggleIcon, { color: colors.subText }]}>{state.isListExpanded ? '⌄' : '⌃'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listWrapper}>
          {state.loading ? (
            <View style={styles.loadingContainer}><Text style={{ color: colors.subText }}>Đang tải dữ liệu...</Text></View>
          ) : (
            <FlatList
              data={state.tasks}
              keyExtractor={(i) => i.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const statusObj = getStatus(item.status);
                const isSelected = state.selectedPoint?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      {
                        backgroundColor: isSelected ? colors.primary + '20' : colors.background,
                        borderLeftColor: statusObj.color,
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelectPoint(item)}
                    onLongPress={() => navigation.navigate('Direction', {
                      id_JobRotation: item.idRotation,
                      start: state.currentLocation,
                      destination: { latitude: item.latitude, longitude: item.longitude },
                    })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.pointName, { color: colors.text }]}>{item.name}</Text>
                      {getRouteCoordinates(item.id).length > 0 && <Text style={[styles.routeIndicator, { color: colors.success }]}>🗺️</Text>}
                    </View>
                    <Text style={[styles.address, { color: colors.subText }]}>#{item.id} - {item.address}</Text>
                    <View style={styles.statusRow}><Text style={[styles.statusText, { color: statusObj.color }]}>{statusObj.label}</Text></View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  taskListContainer: { borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  headerContainer: { paddingVertical: 8, alignItems: 'center' },
  handleBar: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, marginBottom: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  toggleIcon: { fontSize: 20, fontWeight: 'bold' },
  listWrapper: { flex: 1, paddingHorizontal: 10, paddingBottom: 90 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20 },
  card: { padding: 12, borderRadius: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, borderLeftWidth: 4, marginBottom: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pointName: { fontSize: 15, fontWeight: '700', flex: 1 },
  routeIndicator: { fontSize: 12, fontWeight: '600' },
  address: { fontSize: 13, fontWeight: '400', marginBottom: 6, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, fontWeight: '500' },
});

export default HomeScreen;
