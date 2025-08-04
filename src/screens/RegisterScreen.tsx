import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert, // Keep Alert for native dialogs
  Image,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { Ionicons } from '@expo/vector-icons';
import { Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { register } from '../services/auth.service';
import CustomAlert from '../components/CustomAlert';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'ios');
  const [qrCode, setQrCode] = useState('');

  const [parsedInfo, setParsedInfo] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;

  // State for email input
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<string>('success');

  // State to hold all image URIs and their types (important for FormData)
  const [imageUris, setImageUris] = useState({
    avatar: null,
    cccdFront: null,
    cccdBack: null,
    licenseFront: null,
    licenseBack: null,
  });

  // State to store image file details (uri, type, name) for FormData
  const [imageFiles, setImageFiles] = useState({
    avatar: null,
    cccdFront: null,
    cccdBack: null,
    licenseFront: null,
    licenseBack: null,
  });

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      }
    };
    requestPermission();
  }, []);

  useEffect(() => {
    // Laser animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animation]);

  const convertToDateISO = (input: string) => {
    if (!/^\d{8}$/.test(input)) {
      throw new Error("Định dạng ngày không hợp lệ. Phải là chuỗi 8 chữ số kiểu ddMMyyyy.");
    }

    const day = input.substring(0, 2);
    const month = input.substring(2, 4);
    const year = input.substring(4, 8);

    return `${year}-${month}-${day}`;
  }

  const parseQRData = (qrData: string) => {
    const parts = qrData.split('|');
    if (parts.length >= 7) {
      return {
        sdt: parts[0]?.trim() || '',
        soBHYT: parts[1]?.trim() || '',
        hoTen: parts[2]?.trim() || '',
        ngaySinh: parts[3]?.trim() || '',
        gioTinh: parts[4]?.trim() || '',
        diaChi: parts[5]?.trim() || '',
        ngayCap: parts[6]?.trim() || '',
      };
    }
    return null;
  };

  const handleQRRead = (event: any) => {
    const scannedData = event.nativeEvent.codeStringValue;
    setQrCode(scannedData);
    const parsed = parseQRData(scannedData);
    setParsedInfo(parsed);
  };

  const resetScanner = () => {
    setQrCode('');
    setParsedInfo(null);
    setEmail('');
    setPhone('');
    setLoading(false); // Reset loading state
    setImageUris({
      avatar: null,
      cccdFront: null,
      cccdBack: null,
      licenseFront: null,
      licenseBack: null,
    });
    setImageFiles({ // Reset image file details as well
      avatar: null,
      cccdFront: null,
      cccdBack: null,
      licenseFront: null,
      licenseBack: null,
    });
  };

  const handleImagePick = (type) => {
    const options = {
      mediaType: 'photo',
      quality: 0.7, // Reduce quality for faster uploads
      includeBase64: false, // No need for base64 if sending as multipart
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const sourceUri = asset.uri;

        // Update both the URI for display and the file details for FormData
        setImageUris(prevUris => ({
          ...prevUris,
          [type]: sourceUri,
        }));
        setImageFiles(prevFiles => ({
          ...prevFiles,
          [type]: {
            uri: sourceUri,
            type: asset.type || 'image/jpeg', // Use actual type from response, fallback to jpeg
            name: asset.fileName || `${type}_${Date.now()}.jpg`, // Use actual filename, fallback to generated
          },
        }));
      }
    });
  };

  const selectImageFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;

        // Detect QR code from the selected image
        RNQRGenerator.detect({
          uri: imageUri,
        })
          .then((detectionResponse) => {
            const { values } = detectionResponse;
            if (values && values.length > 0) {
              const qrData = values[0];
              // Found a QR code, process it
              setQrCode(qrData);
              const parsed = parseQRData(qrData);
              setParsedInfo(parsed);
            } else {
              Alert.alert('Thông báo', 'Không tìm thấy mã QR trong ảnh đã chọn.');
            }
          })
          .catch((error) => {
            console.log('QR detection error', error);
            Alert.alert('Lỗi', 'Không thể quét mã QR từ ảnh.');
          });
      }
    });
  };

  const handleRegistration = async () => {
    // Validation
    if (!email.trim()) {
      setAlertMessage("Thông tin chưa đầy đủ. Vui lòng nhập email")
      setAlertType('error')
      setShowAlert(true);
      return;
    }

    if (!phone.trim()) {
      setAlertMessage("Thông tin chưa đầy đủ. Vui lòng nhập số điện thoại")
      setAlertType('error')
      setShowAlert(true);

      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const details = {
        fullName: parsedInfo.hoTen,
        address: parsedInfo.diaChi,
        personalId: parsedInfo.sdt,
        dayOfBirth: convertToDateISO(parsedInfo.ngaySinh),
        gender: parsedInfo.gioTinh == "Nam" ? 1 : 0,
        authorityId: 1,
        email: email.trim(),
        phone: phone.trim()
      };
      formData.append('data', JSON.stringify(details));

      Object.keys(imageFiles).forEach(key => {
        const file = imageFiles[key];
        if (file) {
          const uriToSend = file.uri;
          formData.append(key, {
            uri: uriToSend,
            type: file.type,
            name: file.name,
          });
        }
      });

      await register(formData);

      // Success handling
      setAlertMessage("Đăng ký làm tài xế thành công. Vui lòng đợi phản hồi từ email quản trị viên")
      setAlertType('success')
      setShowAlert(true);

    } catch (error) {
      console.error('Registration error:', error);
      setAlertMessage("Đăng ký làm tài xế không thành công. Vui lòng thử lại")
      setAlertType('error')
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const laserY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  // A helper function to render each image upload row to avoid repetition
  const renderImageUploader = (label, type, uri) => (
    <View style={styles.imageUploadRow} key={type}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.imageUploadActions}>
        <TouchableOpacity
          style={[styles.uploadButton, loading && styles.disabledButton]}
          onPress={() => handleImagePick(type)}
          disabled={loading}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
        </TouchableOpacity>
        {uri && <Image source={{ uri }} style={styles.imagePreview} />}
      </View>
    </View>
  );

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Đang chờ cấp quyền camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {showAlert && (
        <CustomAlert
          message={alertMessage}
          type={alertType}
          isVisible={showAlert}
          onClose={() => setShowAlert(false)}
        />
      )}

      {qrCode ? (
        <ScrollView style={styles.resultContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetScanner}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thông Tin Đăng Ký</Text>
            <View style={{ width: 24 }} />
          </View>
          {parsedInfo ? (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                {/* --- Personal Information --- */}
                <Text style={styles.sectionTitle}>Thông Tin Cá Nhân</Text>
                <View style={styles.infoRow}><Text style={styles.label}>Họ và Tên:</Text><Text style={styles.value}>{parsedInfo.hoTen}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Số căn cước:</Text><Text style={styles.value}>{parsedInfo.sdt}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Ngày Sinh:</Text><Text style={styles.value}>{parsedInfo.ngaySinh}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Giới Tính:</Text><Text style={styles.value}>{parsedInfo.gioTinh}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Địa Chỉ:</Text><Text style={styles.valueAddress}>{parsedInfo.diaChi}</Text></View>

                {/* --- Email Input --- */}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    disabled={loading}
                  />
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>SĐT:</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    disabled={loading}
                  />
                </View>

                {/* --- Image Uploads --- */}
                <Text style={styles.sectionTitle}>Tải Lên Hình Ảnh</Text>
                {renderImageUploader('Ảnh đại diện', 'avatar', imageUris.avatar)}
                {renderImageUploader('CCCD mặt trước', 'cccdFront', imageUris.cccdFront)}
                {renderImageUploader('CCCD mặt sau', 'cccdBack', imageUris.cccdBack)}
                {renderImageUploader('GPLX mặt trước', 'licenseFront', imageUris.licenseFront)}
                {renderImageUploader('GPLX mặt sau', 'licenseBack', imageUris.licenseBack)}
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Không thể phân tích dữ liệu</Text>
              <Text style={styles.errorText}>Dữ liệu QR không đúng định dạng.</Text>
              <Text style={styles.rawData}>Dữ liệu gốc: {qrCode}</Text>
            </View>
          )}

          {/* --- Register Button with Loading --- */}
          {parsedInfo && (
            <Button
              mode="contained"
              onPress={handleRegistration}
              style={[styles.registerButton, loading && styles.disabledButton]}
              labelStyle={styles.registerButtonText}
              icon={loading ? () => <ActivityIndicator size="small" color="#fff" /> : "send"}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </Button>
          )}

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Đang xử lý đăng ký...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            scanBarcode={true}
            onReadCode={handleQRRead}
            showFrame={false}
          />
          <View style={styles.overlayContainer}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayLeft} />
              <View style={styles.scanArea}>
                <View style={styles.rectangle}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  <Animated.View style={[styles.laser, { transform: [{ translateY: laserY }] }]} />
                </View>
              </View>
              <View style={styles.overlayRight} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Đặt mã QR trên căn cước vào khung để quét
            </Text>
          </View>

          {/* --- Button to select image from gallery --- */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={selectImageFromGallery}
            >
              <Ionicons name="image-outline" size={24} color="white" />
              <Text style={styles.imagePickerButtonText}>Quét QR từ ảnh</Text>
            </TouchableOpacity>
          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'gray',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  overlayMiddle: { flexDirection: 'row', height: 250 },
  overlayLeft: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  scanArea: { width: 250, height: 250, justifyContent: 'center', alignItems: 'center' },
  overlayRight: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  rectangle: { width: 220, height: 220, position: 'relative' },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#4fff64ff',
    borderWidth: 4,
    borderRadius: 5,
  },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  laser: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  instructionContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imagePickerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  imagePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 40
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 5,
  },
  card: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    width: 120,
  },
  value: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  valueAddress: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  textInput: {
    flex: 1,
    height: 28,
    backgroundColor: '#fff',
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  imageUploadActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    margin: 20,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorCard: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    elevation: 2,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  rawData: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});