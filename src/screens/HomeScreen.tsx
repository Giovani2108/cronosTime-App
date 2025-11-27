import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { strings } from '../utils/i18n';

const { SoundModule } = NativeModules;

const HomeScreen = () => {
    const { coins, addCoins, isLoading } = useWallet();
    const { colors } = useTheme();

    const handleAddCoins = () => {
        SoundModule.playPurchaseSuccess();
        addCoins(10);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 20,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
            marginTop: 20,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.text,
        },
        balanceContainer: {
            backgroundColor: colors.card,
            borderRadius: 15,
            padding: 20,
            alignItems: 'center',
            elevation: 4,
            marginBottom: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        },
        balanceTitle: {
            fontSize: 18,
            color: colors.subText,
            marginTop: 10,
        },
        balanceAmount: {
            fontSize: 36,
            fontWeight: 'bold',
            color: colors.primary,
            marginTop: 5,
        },
        button: {
            backgroundColor: colors.primary,
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 15,
            flexDirection: 'row',
            justifyContent: 'center',
        },
        buttonText: {
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: 10,
        },
        footer: {
            marginTop: 'auto',
            alignItems: 'center',
            paddingVertical: 20,
        },
        footerText: {
            color: colors.subText,
            fontSize: 12,
            textAlign: 'center',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{strings.title}</Text>
            </View>

            <View style={styles.balanceContainer}>
                <Icon name="account-balance-wallet" size={40} color={colors.primary} />
                <Text style={styles.balanceTitle}>{strings.currentBalance}</Text>
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 10 }} />
                ) : (
                    <Text style={styles.balanceAmount}>{coins} {strings.coins}</Text>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleAddCoins}>
                <Icon name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>{strings.earnCoins}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Crontime</Text>
                <Text style={styles.footerText}>Desarrollador: Gio Digital MX</Text>
                <Text style={styles.footerText}>www.giodigitalmx.com</Text>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;
