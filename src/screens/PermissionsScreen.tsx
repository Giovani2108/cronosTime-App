import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UsageStatsModule from '../native/UsageStats';
import OverlayModule from '../native/Overlay';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const PermissionsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [permissions, setPermissions] = useState({
        usageStats: false,
        overlay: false,
        notifications: false,
        battery: false,
    });

    const checkPermissions = async () => {
        const usageStats = await UsageStatsModule.checkUsagePermission();
        const overlay = await OverlayModule.checkOverlayPermission();
        const notifications = await OverlayModule.checkNotificationPermission();
        const battery = await OverlayModule.checkBatteryOptimization();

        setPermissions({
            usageStats,
            overlay,
            notifications,
            battery,
        });
    };

    useEffect(() => {
        checkPermissions();
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const renderPermissionItem = (title: string, description: string, isGranted: boolean, onPress: () => void) => (
        <View style={[styles.permissionItem, { backgroundColor: colors.card }]}>
            <View style={styles.textContainer}>
                <Text style={[styles.permissionTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.permissionDescription, { color: colors.subText }]}>{description}</Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.button,
                    isGranted ? { backgroundColor: colors.success } : { backgroundColor: colors.primary }
                ]}
                onPress={onPress}
                disabled={isGranted}
            >
                <Text style={styles.buttonText}>{isGranted ? 'Granted' : 'Grant'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Necessary Permissions</Text>
                <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
                    To ensure Digital Balance works correctly, please grant the following permissions.
                </Text>

                {renderPermissionItem(
                    "Usage Access",
                    "Required to detect which app is currently running.",
                    permissions.usageStats,
                    () => UsageStatsModule.requestUsagePermission()
                )}

                {renderPermissionItem(
                    "Display Over Other Apps",
                    "Required to show the blocking screen over restricted apps.",
                    permissions.overlay,
                    () => OverlayModule.requestOverlayPermission()
                )}

                {renderPermissionItem(
                    "Notifications",
                    "Required to keep the service running in the background.",
                    permissions.notifications,
                    () => OverlayModule.requestNotificationPermission()
                )}

                {renderPermissionItem(
                    "Ignore Battery Optimization",
                    "Required to prevent the system from killing the app monitoring service.",
                    permissions.battery,
                    () => OverlayModule.requestBatteryOptimization()
                )}

                <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
    },
    headerSubtitle: {
        fontSize: 16,
        marginBottom: 30,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 2,
    },
    textContainer: {
        flex: 1,
        paddingRight: 10,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    permissionDescription: {
        fontSize: 14,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    doneButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 40,
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PermissionsScreen;
