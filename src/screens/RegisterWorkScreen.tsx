import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { registers } from '../services/task.service';

const { width } = Dimensions.get('window');

export default function RegisterWorkScreen() {
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Khởi tạo với ngày hiện tại theo timezone VN
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return new Date(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate());
  });

  // Debug: Log ngày hiện tại để kiểm tra
  useEffect(() => {
    const today = getTodayVN();
    console.log('Today VN date:', today.toString());
    console.log('Today VN local date:', today.toLocaleDateString('vi-VN'));
    console.log('Today VN getDate():', today.getDate());
    console.log('Today VN getMonth():', today.getMonth() + 1); // +1 vì getMonth() trả về 0-11
    console.log('Today VN getFullYear():', today.getFullYear());
  }, []);

  // Lấy ngày hiện tại theo timezone Việt Nam
  const getTodayVN = () => {
    const now = new Date();
    // Chuyển về timezone Việt Nam (UTC+7)
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return new Date(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate());
  };

  // Lấy ngày đầu tuần (Thứ 2)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Tạo array 7 ngày trong tuần
  const getWeekDays = (startDate) => {
    const days = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(getStartOfWeek(currentWeek));

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDayName = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const isToday = (date) => {
    const today = getTodayVN();
    const checkDate = new Date(date);
    
    return today.getFullYear() === checkDate.getFullYear() &&
           today.getMonth() === checkDate.getMonth() &&
           today.getDate() === checkDate.getDate();
  };

  const isPastDate = (date) => {
    const today = getTodayVN();
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  };

  const isCurrentWeek = () => {
    const today = getTodayVN();
    const startOfCurrentWeek = getStartOfWeek(today);
    const startOfDisplayWeek = getStartOfWeek(currentWeek);
    return startOfCurrentWeek.getTime() === startOfDisplayWeek.getTime();
  };

  const isNextWeek = () => {
    const today = getTodayVN();
    const startOfNextWeek = getStartOfWeek(today);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    const startOfDisplayWeek = getStartOfWeek(currentWeek);
    return startOfNextWeek.getTime() === startOfDisplayWeek.getTime();
  };

  const canSelectDates = () => {
    const today = new Date();
    return isNextWeek() 
    // && today.getDay() == 0;
  };

  const toggleDate = (date) => {
    if (!canSelectDates()) return;
    
    // Chỉ disable ngày quá khứ trong tuần hiện tại
    // Nếu là tuần sau thì cho phép chọn tất cả
    if (isCurrentWeek() && isPastDate(date)) return;
    
    const dateString = date.toISOString().split('T')[0];
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateString)) {
      newSelectedDates.delete(dateString);
    } else {
      newSelectedDates.add(dateString);
    }
    
    setSelectedDates(newSelectedDates);
  };

  const isDateSelected = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return selectedDates.has(dateString);
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(getTodayVN());
  };

  const handleSubmit = async () => {
    if (selectedDates.size === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất một ngày.');
      return;
    }

    // Thay đổi payload format thành dates: []
    const payload = {
      dates: Array.from(selectedDates).sort()
    };
    
    
    try {
      setIsSubmitting(true);
      const response = await registers(payload);
      Alert.alert('Thành công', response.message || 'Đăng ký thành công!');
      setSelectedDates(new Set());
    } catch (e: any) {
      console.error(e);
      Alert.alert('Thất bại', e.message || 'Không thể gửi dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const year = start.getFullYear();
    return `${formatDate(start)} - ${formatDate(end)} / ${year}`;
  };

  const getWeekTitle = () => {
    if (isCurrentWeek()) return 'Tuần này';
    if (isNextWeek()) return 'Tuần sau';
    return 'Tuần khác';
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đăng ký ngày làm việc</Text>
        <Text style={styles.headerSubtitle}>Chọn ngày làm việc trong tuần</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            onPress={goToPreviousWeek}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.weekInfo}>
            <Text style={styles.weekTitle}>{getWeekTitle()}</Text>
            <Text style={styles.weekRange}>{getWeekRange()}</Text>
          </View>

          <TouchableOpacity
            onPress={goToNextWeek}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Current Week Button - chỉ hiện khi không phải tuần hiện tại */}
        {!isCurrentWeek() && (
          <TouchableOpacity
            onPress={goToCurrentWeek}
            style={styles.currentWeekButton}
            activeOpacity={0.8}
          >
            <Text style={styles.currentWeekButtonText}>Về tuần hiện tại</Text>
          </TouchableOpacity>
        )}

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>
            {canSelectDates() ? 'Chọn ngày làm việc' : 'Chỉ được chọn trong tuần này hoặc tuần sau'}
          </Text>
          
          <View style={styles.weekGrid}>
            {weekDays.map((date, index) => {
              const selected = isDateSelected(date);
              const today = isToday(date);
              
              // Logic disable: chỉ disable nếu không thể chọn tuần HOẶC là ngày quá khứ trong tuần hiện tại
              const disabled = !canSelectDates() || (isCurrentWeek() && isPastDate(date));
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selected && styles.dayButtonSelected,
                    today && styles.dayButtonToday,
                    disabled && styles.dayButtonPast,
                  ]}
                  onPress={() => toggleDate(date)}
                  disabled={disabled}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.dayName,
                    selected && styles.dayNameSelected,
                    today && styles.dayNameToday,
                    disabled && styles.dayNamePast,
                  ]}>
                    {getDayName(date)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    selected && styles.dayNumberSelected,
                    today && styles.dayNumberToday,
                    disabled && styles.dayNumberPast,
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Dates List */}
        {selectedDates.size > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>
              Ngày đã chọn ({selectedDates.size})
            </Text>
            <View style={styles.selectedList}>
              {Array.from(selectedDates).sort().map(dateString => {
                const date = new Date(dateString + 'T00:00:00');
                return (
                  <View key={dateString} style={styles.selectedItem}>
                    <View style={styles.selectedItemContent}>
                      <Text style={styles.selectedItemText}>
                        {formatFullDate(date)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const newSelected = new Set(selectedDates);
                        newSelected.delete(dateString);
                        setSelectedDates(newSelected);
                      }}
                      style={styles.removeSelectedButton}
                    >
                      <Text style={styles.removeSelectedText}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || selectedDates.size === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || selectedDates.size === 0}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>Đang xử lý...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Đăng ký {selectedDates.size > 0 ? `(${selectedDates.size} ngày)` : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  weekRange: {
    fontSize: 14,
    color: '#64748b',
  },
  currentWeekButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  currentWeekButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 20,
    textAlign: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: (width - 80) / 7,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dayButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayButtonToday: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  dayButtonPast: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.5,
  },
  dayName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNameSelected: {
    color: '#ffffff',
  },
  dayNameToday: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  dayNamePast: {
    color: '#94a3b8',
  },
  dayNumber: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: 'bold',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  dayNumberToday: {
    color: '#f59e0b',
  },
  dayNumberPast: {
    color: '#94a3b8',
  },
  selectedContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
  },
  selectedList: {
    gap: 10,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  selectedItemContent: {
    flex: 1,
  },
  selectedItemText: {
    fontSize: 15,
    color: '#1a202c',
    fontWeight: '500',
  },
  removeSelectedButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSelectedText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitContainer: {
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e0',
    shadowOpacity: 0.1,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 8,
  },
});