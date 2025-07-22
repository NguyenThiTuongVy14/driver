import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getShifts, registers } from '../services/task.service';

const { width } = Dimensions.get('window');

export default function RegisterWorkScreen() {
  const [formList, setFormList] = useState([
    {
      id: Date.now(),
      date: new Date(),
      showPicker: false,
      shifts: [],
      animatedValue: new Animated.Value(0),
    },
  ]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allShifts, setAllShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoadingShifts(true);
        const response = await getShifts();
        setAllShifts(response);
        setFormList(formList =>
          formList.map(form => ({
            ...form,
            shifts: response.map(shift => ({ ...shift, enabled: false })),
          }))
        );
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải danh sách ca làm việc.');
      } finally {
        setLoadingShifts(false);
      }
    };

    fetchShifts();
  }, []);

  const addForm = () => {
    const newForm = {
      id: Date.now(),
      date: new Date(),
      showPicker: false,
      shifts: allShifts.map(shift => ({ ...shift, enabled: false })),
      animatedValue: new Animated.Value(0),
    };

    setFormList(prev => [...prev, newForm]);

    // Animate new form appearance
    Animated.spring(newForm.animatedValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const updateDate = (formId, newDate) => {
    setFormList(prev =>
      prev.map(form =>
        form.id === formId ? { ...form, date: newDate, showPicker: false } : form
      )
    );
  };

  const toggleShift = (formId, shiftId) => {
    setFormList(prev =>
      prev.map(form =>
        form.id === formId
          ? {
            ...form,
            shifts: form.shifts.map(shift =>
              shift.id === shiftId ? { ...shift, enabled: !shift.enabled } : shift
            ),
          }
          : form
      )
    );
  };

  const toggleDatePicker = (formId) => {
    setFormList(prev =>
      prev.map(form =>
        form.id === formId ? { ...form, showPicker: !form.showPicker } : form
      )
    );
  };

  const removeForm = (formId) => {
    const formToRemove = formList.find(form => form.id === formId);

    if (formToRemove) {
      Animated.timing(formToRemove.animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFormList(prev => prev.filter(form => form.id !== formId));
      });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    const payload = [];

    for (let form of formList) {
      const selectedShiftIds = form.shifts.filter(s => s.enabled).map(s => s.id);
      if (selectedShiftIds.length === 0) {
        Alert.alert('Thiếu thông tin', 'Mỗi ngày phải chọn ít nhất một ca.');
        return;
      }

      payload.push({
        rotationDate: form.date.toISOString().substring(0, 10),
        shiftId: selectedShiftIds,
      });
    }

    try {
      setIsSubmitting(true);
      const response = await registers(payload);
      Alert.alert('Thành công', response.message || 'Đăng ký thành công!');
      setFormList([
        {
          id: Date.now(),
          date: new Date(),
          showPicker: false,
          shifts: allShifts.map(shift => ({ ...shift, enabled: false })),
          animatedValue: new Animated.Value(1),
        },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Thất bại', e.message || 'Không thể gửi dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedShiftsCount = (form) => {
    return form.shifts.filter(shift => shift.enabled).length;
  };

  useEffect(() => {
    if (formList.length > 0 && formList[0].animatedValue) {
      Animated.spring(formList[0].animatedValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [allShifts]);

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      {/* Header với gradient */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đăng ký ca làm việc</Text>
        <Text style={styles.headerSubtitle}>Chọn ngày và ca làm việc của bạn</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {formList.map((form, index) => (
          <Animated.View
            key={form.id}
            style={[
              styles.sectionCard,
              {
                opacity: form.animatedValue || 1,
                transform: [
                  {
                    translateY: form.animatedValue
                      ? form.animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      })
                      : 0,
                  },
                  {
                    scale: form.animatedValue
                      ? form.animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      })
                      : 1,
                  },
                ],
              },
            ]}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Ngày {index + 1}</Text>
                {getSelectedShiftsCount(form) > 0 && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {getSelectedShiftsCount(form)} ca
                    </Text>
                  </View>
                )}
              </View>

              {formList.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeForm(form.id)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeIcon}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Date Picker */}
            <TouchableOpacity
              onPress={() => toggleDatePicker(form.id)}
              style={styles.dateButton}
              activeOpacity={0.8}
            >
              <View style={styles.dateButtonContent}>
                <Text style={styles.dateIcon}>📅</Text>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Ngày làm việc</Text>
                  <Text style={styles.dateButtonText}>{formatDate(form.date)}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {form.showPicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={form.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, value) => updateDate(form.id, value || form.date)}
                />
              </View>
            )}

            {/* Shifts Section */}
            <View style={styles.shiftsContainer}>
              <Text style={styles.shiftsTitle}>Chọn ca làm việc</Text>

              {loadingShifts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>Đang tải ca làm việc...</Text>
                </View>
              ) : (
                <View style={styles.shiftsGrid}>
                  {form.shifts.map(shift => (
                    <TouchableOpacity
                      key={shift.id}
                      style={[
                        styles.shiftCard,
                        shift.enabled && styles.shiftCardSelected
                      ]}
                      onPress={() => toggleShift(form.id, shift.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.shiftCardContent}>
                        <Text style={[
                          styles.shiftName,
                          shift.enabled && styles.shiftNameSelected
                        ]}>
                          {shift.name}
                        </Text>
                        <Text style={[
                          styles.shiftTime,
                          shift.enabled && styles.shiftTimeSelected
                        ]}>
                          {shift.startTime} - {shift.endTime}
                        </Text>
                      </View>
                      <View style={[
                        styles.shiftCheckbox,
                        shift.enabled && styles.shiftCheckboxSelected
                      ]}>
                        {shift.enabled && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        ))}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addForm}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addButtonText}>Thêm ngày mới</Text>
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>Đang xử lý...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}> Đăng ký ngay</Text>
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
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginRight: 10,
  },
  selectedBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: '#dc2626',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '600',
  },
  datePickerContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  shiftsContainer: {
    marginTop: 10,
  },
  shiftsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
  },
  shiftsGrid: {
    gap: 12,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  shiftCardSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  shiftCardContent: {
    flex: 1,
  },
  shiftName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  shiftNameSelected: {
    color: '#667eea',
  },
  shiftTime: {
    fontSize: 13,
    color: '#64748b',
  },
  shiftTimeSelected: {
    color: '#667eea',
  },
  shiftCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftCheckboxSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#667eea',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
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
    backgroundColor: '#a5b4fc',
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