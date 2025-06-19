import React, { useState } from 'react';
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
import { updateTaskStatus, getStatus } from '../services/task';
import { connectWebSocket, disconnectWebSocket } from '../socket/websocket';
import {useEffect } from 'react';

export default function TaskDetailScreen() {
  useEffect(() => {
  connectWebSocket(`/topic/job-status-${task.position.id}`, (msg) => {
    console.log('[WS] Nhận dữ liệu:', msg.body);
  });

  return () => {
    disconnectWebSocket();
  };
}, []);
  const route = useRoute();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const { task } = route.params as {
    task: {
      id: number;
      status: string;
      rotationDate: string;
      shift: {
        name: string;
      };
      position: {
        name: string;
        address: string;
        lat: string;
        lng: string;
      };
    };
  };

  const lat = parseFloat(task.position.lat);
  const lng = parseFloat(task.position.lng);
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


  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.jobName} numberOfLines={2}>
            Công việc #{task.id}
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
            <Icon name="place" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Vị trí:</Text>
            <Text style={styles.value}>{task.position.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="home-work" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Địa chỉ:</Text>
            <Text style={styles.value}>{task.position.address}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="event" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Ngày:</Text>
            <Text style={styles.value}>{task.rotationDate}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="schedule" size={20} color="#1565C0" style={styles.icon} />
            <Text style={styles.label}>Ca làm:</Text>
            <Text style={styles.value}>{task.shift.name}</Text>
          </View>
        </Animated.View>
        

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            showsUserLocation={false}
            loadingEnabled={true}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              title={task.position.name}
              description={task.position.address}
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
          disabled={loading || task.status !== 'ASSIGNED'}
          onPress={() => handleComplete()}
          style={styles.floatingButton}
          labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          icon="check"
        >
          Hoàn thành công việc
        </Button>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#E8F5E9', // nền dịu hơn
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Header hiển thị Công việc + Trạng thái
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
    backgroundColor: '#E8F5E9',
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
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#607D8B',
    marginRight: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    flexShrink: 1,
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

    backgroundColor: '#81C784',
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 6,
  },
});

