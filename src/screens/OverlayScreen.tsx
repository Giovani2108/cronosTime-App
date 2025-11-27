import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, BackHandler } from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useApps } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { OverlayModule, SoundModule } = NativeModules;

const OverlayScreen = ({ route }: any) => {
    const { packageName, cost, duration, message, showMessage } = route.params || {};
    const { coins, spendCoins } = useWallet();
    const { incrementAvoidedLaunches } = useApps();
    const { colors } = useTheme();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleExit();
            return true;
        });
        return () => backHandler.remove();
    }, []);

    const handleUnlock = async () => {
        if (coins >= cost) {
            const success = await spendCoins(cost);
            if (success) {
                SoundModule.playPurchaseSuccess();
                OverlayModule.unlockApp(packageName, duration);
                // The native module will close the activity
            } else {
                setError("Transaction failed");
            }
        } else {
            SoundModule.playError();
            setError("Not enough coins!");
        }
    };

    const handleExit = () => {
        incrementAvoidedLaunches(packageName);
        OverlayModule.closeOverlay();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        card: {
            backgroundColor: colors.card,
            padding: 30,
            borderRadius: 20,
            alignItems: 'center',
            width: '90%',
            elevation: 10,
        },
        icon: {
            marginBottom: 20,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 10,
            textAlign: 'center',
        },
        message: {
            fontSize: 16,
            color: colors.text,
            textAlign: 'center',
            marginBottom: 20,
            fontStyle: 'italic',
            paddingHorizontal: 10,
        },
        costContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 30,
            backgroundColor: colors.background,
            padding: 15,
            borderRadius: 15,
        },
        costText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.primary,
            marginLeft: 10,
        },
        buttonContainer: {
            width: '100%',
            gap: 15,
        },
        unlockButton: {
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
        },
        unlockText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: 10,
        },
        exitButton: {
            backgroundColor: 'transparent',
            padding: 15,
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.subText,
        },
        exitText: {
            color: colors.subText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        errorText: {
            color: colors.error,
            marginBottom: 15,
            fontWeight: 'bold',
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Icon name="lock" size={60} color={colors.primary} style={styles.icon} />
                <Text style={styles.title}>App Locked</Text>

                {showMessage && message ? (
                    <Text style={styles.message}>"{message}"</Text>
                ) : (
                    <Text style={[styles.message, { fontStyle: 'normal' }]}>
                        This app is restricted. Unlock it to continue.
                    </Text>
                )}

                <View style={styles.costContainer}>
                    <Icon name="monetization-on" size={30} color={colors.primary} />
                    <Text style={styles.costText}>{cost} Coins / 10 min</Text>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
                        <Icon name="lock-open" size={24} color="#fff" />
                        <Text style={styles.unlockText}>Unlock</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                        <Text style={styles.exitText}>I'll do something else</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default OverlayScreen;
