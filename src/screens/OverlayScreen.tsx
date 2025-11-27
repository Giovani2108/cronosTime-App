import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Alert } from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useTimer } from '../context/TimerContext';

// This screen is not navigated to by React Navigation usually.
// It is intended to be shown when the Native Overlay is active, 
// BUT since we can't easily render a full React Native screen inside the native overlay service 
// without complex setup (Headless JS or multiple RN instances),
// the Native Service currently shows a native Android view.
//
// However, if we wanted to handle the UI in RN, we would need to bring the app to foreground.
//
// For this MVP, the "Unlock" button in the Native Overlay Service should probably 
// send an Intent to open the main app to a specific screen, OR we handle the logic natively.
//
// Given the complexity, let's assume the Native Overlay Service has a button "Open App to Unlock".
// When clicked, it opens this screen.

const OverlayScreen = () => {
    const { spendCoins } = useWallet();
    const { startTimer } = useTimer();

    const handleUnlock = async () => {
        const success = await spendCoins(10);
        if (success) {
            startTimer(10); // 10 minutes
            // Close the app or minimize it to let user use the restricted app
            BackHandler.exitApp();
        } else {
            Alert.alert("Error", "Not enough coins!");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Restricted App Detected</Text>
            <Text style={styles.message}>
                You are trying to use a restricted app.
                Would you like to buy 10 minutes for 10 coins?
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleUnlock}>
                <Text style={styles.buttonText}>Unlock (10 Coins)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={() => BackHandler.exitApp()}>
                <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 20,
    },
    title: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    message: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#03dac6',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#cf6679',
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OverlayScreen;
