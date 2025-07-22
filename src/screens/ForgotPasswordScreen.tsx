import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { forgotPassword, resetPassword } from '../services/auth.service';

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: username, 2: OTP, 3: new password
    const [username, setUsername] = useState('');
    const [otp, setOTP] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const otpInputs = useRef([]);

    const handleSendOTP = async () => {
        if (!username.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập username');
            return;
        }
        try {
            setLoading(true);
            await forgotPassword(username);
            Alert.alert('Thành công', 'OTP đã được gửi đến email của bạn');
            setStep(2);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (text, index) => {
        // Chỉ cho phép nhập số
        if (!/^\d*$/.test(text)) return;
        
        const newOTP = [...otp];
        newOTP[index] = text;
        setOTP(newOTP);
        
        // Tự động chuyển sang ô tiếp theo
        if (text && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOTPKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = () => {
        const otpString = otp.join('');
        if (otpString.length ===0) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP 6 số');
            return;
        }
        // Chuyển sang bước 3 mà không gọi API
        setStep(3);
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        try {
            setLoading(true);
            const otpString = otp.join('');
            await resetPassword(username, otpString, newPassword);
            Alert.alert('Thành công', 'Mật khẩu đã được đặt lại thành công', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Mã OTP không hợp lệ hoặc không thể đặt lại mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Quên Mật Khẩu';
            case 2: return 'Nhập Mã OTP';
            case 3: return 'Đặt Mật Khẩu Mới';
            default: return 'Quên Mật Khẩu';
        }
    };

    const getStepSubtitle = () => {
        switch (step) {
            case 1: return 'Nhập username để nhận mã OTP';
            case 2: return 'Nhập mã OTP đã được gửi đến email';
            case 3: return 'Nhập mật khẩu mới cho tài khoản';
            default: return '';
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên đăng nhập</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Nhập username của bạn"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                );

            case 2:
                return (
                    <View style={styles.inputGroup}>
                        {/* <Text style={styles.label}>Mã OTP</Text> */}
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => otpInputs.current[index] = ref}
                                    style={[
                                        styles.otpInput,
                                        digit && styles.otpInputFilled
                                    ]}
                                    value={digit}
                                    onChangeText={text => handleOTPChange(text, index)}
                                    onKeyPress={e => handleOTPKeyPress(e, index)}
                                  
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    maxLength={1}
                                    textAlign="center"
                                />
                            ))}
                        </View>
                    </View>
                );

            case 3:
                return (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu mới</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nhập mật khẩu mới"
                                placeholderTextColor="#999"
                                secureTextEntry={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Xác nhận mật khẩu</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Nhập lại mật khẩu mới"
                                placeholderTextColor="#999"
                                secureTextEntry={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </>
                );

            default:
                return null;
        }
    };

    const getButtonText = () => {
        switch (step) {
            case 1: return 'Gửi OTP';
            case 2: return 'Xác nhận OTP';
            case 3: return 'Đặt lại mật khẩu';
            default: return 'Tiếp tục';
        }
    };

    const getButtonAction = () => {
        switch (step) {
            case 1: return handleSendOTP;
            case 2: return handleVerifyOTP;
            case 3: return handleResetPassword;
            default: return () => {};
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />
            {/* <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            > */}
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{getStepTitle()}</Text>
                            <Text style={styles.subtitle}>
                                {getStepSubtitle()}
                            </Text>
                        </View>

                        {/* Step Indicator */}
                        <View style={styles.stepIndicator}>
                            <View style={styles.stepContainer}>
                                <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
                                    <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
                                </View>
                                <Text style={styles.stepLabel}>Username</Text>
                            </View>
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={styles.stepContainer}>
                                <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
                                    <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
                                </View>
                                <Text style={styles.stepLabel}>OTP</Text>
                            </View>
                            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                            <View style={styles.stepContainer}>
                                <View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
                                    <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
                                </View>
                                <Text style={styles.stepLabel}>Password</Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            {renderStepContent()}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={getButtonAction()}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>{getButtonText()}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Text style={styles.backButtonText}>
                                    {step > 1 ? 'Quay lại' : 'Quay lại Đăng nhập'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            {/* </LinearGradient> */}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        padding: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 20,
        backgroundColor: '#f8f9fa',
    },
    stepContainer: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e1e5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    stepActive: {
        backgroundColor: '#667eea',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#e1e5e9',
        marginHorizontal: 10,
    },
    stepLineActive: {
        backgroundColor: '#667eea',
    },
    form: {
        padding: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        alignItems: 'center',
    },
    backButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '500',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    otpInput: {
        width: 45,
        height: 60,
        borderWidth: 2,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        fontSize: 30,
        fontWeight: '500',
        backgroundColor: '#f8f9fa',
        color: '#333',
    },
    otpInputFilled: {
        borderColor: '#667eea',
        backgroundColor: '#fff',
    },
});

export default ForgotPasswordScreen;