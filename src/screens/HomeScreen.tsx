import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import WasteMapView from '../components/WasteMapView';
import { useAppColors } from '../hooks/useAppColors';

const fakeWastePoints = [
  { id:1, latitude:10.8231, longitude:106.6297, status:'ready', address:'123 Nguyễn Huệ', weight:'50kg', time:'08:00' },
  { id:2, latitude:10.8331, longitude:106.6397, status:'completed', address:'456 Lê Lợi', weight:'30kg', time:'08:30' },
  { id:3, latitude:10.8131, longitude:106.6197, status:'pending', address:'789 Đồng Khởi', weight:'40kg', time:'09:00' },
];
const routeCoordinates = fakeWastePoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
const currentLocation = { latitude: 10.8281, longitude: 106.6347 };

const HomeScreen = () => {
  const { colors } = useAppColors();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  Animated.loop(Animated.sequence([
    Animated.timing(animatedValue, { toValue:1, duration:1000, useNativeDriver:true }),
    Animated.timing(animatedValue, { toValue:0, duration:1000, useNativeDriver:true })
  ])).start();

  const handlePointPress = (p:any) => console.log('Pressed', p);
  const getPointColor = (status:'ready'|'completed'|'pending') => ({
    ready: colors.primary,
    completed: colors.success,
    pending: colors.danger
  }[status]);

  return (
      <View style={{ flex:1, backgroundColor: colors.background }}>
        <View style={{ flex:2 }}>
          <WasteMapView
              wastePoints={fakeWastePoints}
              routeCoordinates={routeCoordinates}
              animatedValue={animatedValue}
              handlePointPress={handlePointPress}
              getPointColor={getPointColor}
              currentLocation={currentLocation}
          />
        </View>
        <View style={{ flex:1, padding:10 }}>
          <Text style={[styles.title, { color: colors.text }]}>📋 Danh sách điểm rác</Text>
          <FlatList
              data={fakeWastePoints}
              keyExtractor={i => i.id.toString()}
              renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.item, { backgroundColor: colors.card }]}>
                    <Text style={{ color: colors.text }}>{item.address}</Text>
                    <Text style={{ color: colors.subText }}>
                      {item.status.toUpperCase()} • {item.weight}
                    </Text>
                  </TouchableOpacity>
              )}
          />
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize:18, fontWeight:'600', marginBottom:8 },
  item: { padding:12, borderRadius:8, marginBottom:8 }
});

export default HomeScreen;
