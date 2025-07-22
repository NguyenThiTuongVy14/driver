import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { updateTaskStatus, getStatus } from '../services/task.service';
import { connectWebSocket, disconnectWebSocket } from '../socket/websocket';

export default function TaskDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Updated interface to match the new data structure
  const { task } = route.params as {
    task: {
      id: number;
      latitude: number;
      longitude: number;
      status: string;
      address: string;
      name: string;
      image?: string;
    };
  };

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectWebSocket(`/topic/job-status-${task.id}`, (msg) => {
      console.log('[WS] Nhận dữ liệu:', msg.body);
      // You can update the task status here if needed
    });

    return () => {
      disconnectWebSocket();
    };
  }, [task.id]);

  const statusInfo = getStatus(task.status);

  const handleComplete = async () => {
    try {
      setLoading(true);
      await updateTaskStatus(task.id);
      Alert.alert('✔️ Thành công', 'Đã cập nhật trạng thái công việc!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật trạng thái');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get current date for display
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.jobName} numberOfLines={2}>
            {task.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusInfo.backgroundColor,
                borderColor: statusInfo.borderColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Icon name="business" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>#{task.id}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="place" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Tên điểm:</Text>
            <Text style={styles.value}>{task.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="home-work" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Địa chỉ:</Text>
            <Text style={styles.value}>{task.address}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="my-location" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Tọa độ:</Text>
            <Text style={styles.value}>
              {task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="event" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Ngày:</Text>
            <Text style={styles.value}>{getCurrentDate()}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="info" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={[styles.value, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: task.latitude,
              longitude: task.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            showsUserLocation={true}
            loadingEnabled={true}
          >
            <Marker
              coordinate={{ 
                latitude: task.latitude, 
                longitude: task.longitude 
              }}
              title={task.name}
              description={task.address}
              pinColor="#0D47A1"
            />
          </MapView>
        </Animated.View>
      </ScrollView>

      {/* Button nằm ngoài scroll, luôn nổi */}
      <View style={styles.floatingButtonWrapper}>
        <Button
          mode="contained"
          loading={loading}
          disabled={loading || (task.status !== 'ASSIGNED' && task.status !== 'ACTIVE')}
          onPress={() => handleComplete()}
          style={[
            styles.floatingButton,
            {
              backgroundColor: 
                task.status === 'COMPLETED' ? '#81C784' : 
                (task.status === 'ASSIGNED' || task.status === 'ACTIVE') ? '#4CAF50' : '#BDBDBD'
            }
          ]}
          labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          icon={task.status === 'COMPLETED' ? 'check-circle' : 'check'}
        >
          {task.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Hoàn thành công việc'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120, // Extra padding for floating button
  },

  // Header hiển thị tên điểm + Trạng thái
  headerRow: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  jobName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    flexShrink: 1,
    flex: 1,
    textAlign: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Hộp thông tin
  infoBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#607D8B',
    marginRight: 8,
    minWidth: 80,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    flexShrink: 1,
    flex: 1,
  },

  // Bản đồ
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 32,
  },
  map: {
    height: 300,
  },

  // Nút nổi phía dưới
  floatingButtonWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  floatingButton: {
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 6,
  },
});