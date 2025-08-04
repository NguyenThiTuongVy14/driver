import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import WasteMapView from '../components/WasteMapView';
import { useAppColors } from '../hooks/useAppColors';
import { fetchTasks, getStatus } from '../services/task.service';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomAlert from '../components/CustomAlert';
import axios from 'axios';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const listHeight = useRef(new Animated.Value(180)).current;
  const animatedValue = useRef(new Animated.Value(100)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

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

  const fetchTasksData = useCallback(async () => {
    try {
      const response = await fetchTasks();
      const mapped: WastePoint[] = response.map((item: any) => ({
        idRotation: item.jobRotationId,
        idPosition: item.position.id,
        latitude: item.position.lat,
        longitude: item.position.lng,
        status: item.status,
        address: item.position.address,
        name: item.position.name,
        image: item.position.image,
        id: item.position.id,
      }));

      const distanceMatrix: number[][] = [
        [0, 9.35, 5.23, 9.49, 3.89, 3.74],  // Bãi 3
        [9.09, 0, 13.61, 9.26, 6.17, 6.09], // Bãi 2
        [4.98, 13.13, 0, 12.19, 8.81, 8.03],// Bãi 4
        [9.96, 8.72, 12.32, 0, 9.48, 8],    // Bãi 5
        [3.98, 5.61, 7.98, 9.61, 0, 1.76],  // Bãi 6
        [3.04, 6.09, 7.64, 8.46, 2.21, 0],     // Bãi 7
      ];
      
      console.table(distanceMatrix);
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

    // await Promise.allSettled(
    //   points.map(async (p) => {
    //     try {
    //       newCache[`route_${p.id}`] = {
    //         coordinates: await fetchRoute(
    //           { lat: currentLoc.latitude, lng: currentLoc.longitude },
    //           { lat: p.latitude, lng: p.longitude }
    //         ),
    //         fromLocation: currentLoc,
    //         timestamp: Date.now(),
    //       };
    //     } catch { }
    //   })
    // );

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
    const targetHeight = state.isListExpanded ? 150 : SCREEN_HEIGHT * 0.48;
    
    Animated.parallel([
      Animated.spring(listHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(slideAnimation, {
        toValue: state.isListExpanded ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    updateState({ isListExpanded: !state.isListExpanded });
  };

  const getRouteCoordinates = (id: number) => state.routeCache[`route_${id}`]?.coordinates || [];
  
  const getPointColor = (status: string) => ({
    PENDING: colors.primary,
    LATE: colors.danger,
    COMPLETED: colors.success,
    PROCESSING: colors.primary,
  }[status] || colors.subText);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'LATE': return '⚠️';
      case 'COMPLETED': return '✅';
      case 'PROCESSING': return '🔄';
      default: return '📍';
    }
  };

  const renderTaskItem = ({ item, index }: { item: WastePoint; index: number }) => {
    const statusObj = getStatus(item.status);
    const isSelected = state.selectedPoint?.id === item.id;
    const hasRoute = getRouteCoordinates(item.id).length > 0;

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0],
              })
            }],
            opacity: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            })
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: isSelected ? colors.primary + '15' : colors.background,
              borderLeftColor: statusObj.color,
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? colors.primary : 'transparent',
              shadowColor: colors.primary,
              shadowOpacity: isSelected ? 0.15 : 0.08,
              // transform: [{ scale: isSelected ? 1.02 : 1 }],
            },
          ]}
          onPress={() => handleSelectPoint(item)}
          onLongPress={() => navigation.navigate('Direction', {
            id_JobRotation: item.idRotation,
            start: state.currentLocation,
            destination: { latitude: item.latitude, longitude: item.longitude },
            address: item.address
          })}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardIndex, { color: colors.subText }]}>
                  #{(index + 1).toString().padStart(2, '0')}
                </Text>
                <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                {hasRoute && (
                  <View style={[styles.routeBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.routeText, { color: colors.success }]}>🛣️</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusObj.color + '20' }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.address, { color: colors.subText }]} numberOfLines={2}>
              📍 {item.address}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.statusRow}>
                {item.idPosition == 999 || item.idPosition == 1000
                  ?<Text style={[styles.statusText, { color: statusObj.color }]}>
                    {item.idPosition == 999 ? "Điểm xuất phát" : "Điểm cuối"}
                  </Text>

                  :<Text style={[styles.statusText, { color: statusObj.color }]}>
                    {statusObj.label}
                  </Text>
                }
              </View>
              {isSelected && (
                <Text style={[styles.actionHint, { color: colors.primary }]}>
                  Nhấn giữ để điều hướng →
                </Text>
              )}
            </View>
          </View>

          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: colors.subText }]}>📋</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có công việc</Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
        Danh sách công việc sẽ xuất hiện ở đây
      </Text>
    </View>
  );

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
        <CustomAlert 
          message={state.alert.message} 
          type={state.alert.type} 
          isVisible={state.alert.show} 
          onClose={() => updateState({ alert: { ...state.alert, show: false } })} 
        />
      )}

      <Animated.View style={[
        styles.taskListContainer, 
        { 
          backgroundColor: colors.card, 
          height: listHeight,
          shadowColor: colors.text,
        }
      ]}>
        <TouchableOpacity 
          style={styles.headerContainer} 
          onPress={toggleList} 
          activeOpacity={0.7}
        >
          <View style={[styles.handleBar, { backgroundColor: colors.subText + '40' }]} />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>
                Điểm thu gom
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {state.tasks.length}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {state.isLoadingRoutes && (
                <View style={styles.loadingBadge}>
                  <Text style={[styles.loadingText, { color: colors.primary }]}>⏳</Text>
                </View>
              )}
              <Text style={[styles.toggleIcon, { color: colors.subText }]}>
                {state.isListExpanded ? '⌄' : '⌃'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.listWrapper}>
          {state.loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingIcon, { color: colors.primary }]}>⏳</Text>
              <Text style={[styles.loadingTitle, { color: colors.text }]}>
                Đang tải dữ liệu...
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.subText }]}>
                Vui lòng chờ trong giây lát
              </Text>
            </View>
          ) : (
            <FlatList
              data={state.tasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTaskItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              bounces={true}
              scrollEventThrottle={16}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 2,
  },
  taskListContainer: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    elevation: 8,
  },
  headerContainer: { 
    paddingVertical: 12, 
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  handleBar: { 
    width: 50, 
    height: 5, 
    borderRadius: 3, 
    marginBottom: 12,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '800',
    marginRight: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingBadge: {
    padding: 4,
  },
  loadingText: {
    fontSize: 16,
  },
  toggleIcon: { 
    fontSize: 24, 
    fontWeight: 'bold',
  },
  listWrapper: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingBottom: 80,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    // paddingVertical: 10,
  },
  loadingIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: { 
    paddingTop: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
  cardContainer: {
    marginBottom: 4,
  },
  card: { 
    borderRadius: 16, 
    elevation: 3, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cardIndex: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 24,
  },
  pointName: { 
    fontSize: 16, 
    fontWeight: '700',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIcon: {
    fontSize: 14,
  },
  address: { 
    fontSize: 14, 
    fontWeight: '400', 
    marginBottom: 12, 
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: '600',
  },
  actionHint: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 4,
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;