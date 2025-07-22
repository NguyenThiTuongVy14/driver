import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppColors } from '../hooks/useAppColors';
import { getNotifications, updateNotificationRead } from '../services/notify.service';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  isRead?: boolean;
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { colors } = useAppColors();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(sortedData);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistically update UI first
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Call API to update on server
      await updateNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      // Optimistically update UI first
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Call API to update all unread notifications
      await Promise.all(unreadIds.map(id => updateNotificationRead(id)));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      
      // Revert optimistic update on error
      await fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (item: Notification) => {
    switch (item.type) {
      case 'warning': return 'alert-circle';
      case 'error': return 'close-circle';
      case 'success': return 'checkmark-circle';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (item: Notification) => {
    switch (item.type) {
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      case 'success': return '#34C759';
      case 'info': return '#007AFF';
      default: return colors.primary;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: colors.card,
          borderLeftColor: getNotificationColor(item),
          opacity: item.isRead ? 0.7 : 1,
        }
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.itemContentWrapper}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item) + '15' }]}>
          <Ionicons
            name={getNotificationIcon(item)}
            size={20}
            color={getNotificationColor(item)}
          />
        </View>
        
        <View style={styles.textContent}>
          <View style={styles.contentHeader}>
            <View style={styles.textContainer}>
              {/* Title section */}
              {item.title && (
                <Text 
                  style={[
                    styles.notificationTitle, 
                    { color: colors.text },
                    item.isRead && styles.readText
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              )}
              
              {/* Content section */}
              <Text 
                style={[
                  styles.notificationContent, 
                  { color: colors.subText },
                  item.isRead && styles.readText,
                  !item.title && { color: colors.text }
                ]}
                numberOfLines={item.title ? 2 : 3}
              >
                {item.content}
              </Text>
            </View>
            
            {/* Unread indicator */}
            <View style={styles.rightSection}>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          </View>
          
          {/* Timestamp */}
          <View style={styles.timestampContainer}>
            <Ionicons 
              name="time-outline" 
              size={12} 
              color={colors.subText} 
              style={styles.timeIcon}
            />
            <Text style={[styles.notificationTimestamp, { color: colors.subText }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={colors.scheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />

      {/* Enhanced Header */}
      <View style={[styles.header, { borderBottomColor: colors.primary + '10' }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBadgeContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Thông báo</Text>
              <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
                {notifications.length} thông báo
              </Text>
            </View>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: colors.primary + '10' }]}
              onPress={markAllAsRead}
            >
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Đánh dấu tất cả
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyComponent}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '08' }]}>
                <Ionicons 
                  name="notifications-off-outline" 
                  size={48} 
                  color={colors.subText} 
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Chưa có thông báo
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                Các thông báo mới sẽ xuất hiện tại đây
              </Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 30
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadgeContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  markAllButton: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
  },
  itemContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationContent: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  readText: {
    opacity: 0.7,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeIcon: {
    marginRight: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
  emptyComponent: {
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});