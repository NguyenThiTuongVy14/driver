import React, { useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { RNCamera } from 'react-native-camera';

export default function QRScannerScreen() {
  const [qrData, setQrData] = useState('');
  const [scanned, setScanned] = useState(false);

  const onBarCodeRead = ({ data }) => {
    if (!scanned) {
      setScanned(true);
      setQrData(data);
      setTimeout(() => setScanned(false), 3000); // Cho phép quét lại sau 3s
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <RNCamera
          style={styles.camera}
          onBarCodeRead={onBarCodeRead}
          captureAudio={false}
        >
          <View style={styles.overlay}>
            <Text style={styles.scanText}>Đưa mã QR vào khung</Text>
          </View>
        </RNCamera>
      </View>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Dữ liệu QR:</Text>
        <Text style={styles.resultData}>
          {qrData || 'Chưa có dữ liệu'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cameraContainer: {
    height: 350,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
  },
  resultContainer: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultData: {
    fontSize: 16,
    color: '#333',
  },
});
