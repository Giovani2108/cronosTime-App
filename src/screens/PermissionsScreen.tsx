import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState } from 'react-native';
import UsageStatsModule from '../native/UsageStats';
import OverlayModule from '../native/Overlay';
import { useNavigation } from '@react-navigation/native';

const PermissionsScreen = () => {
    const navigation = useNavigation();
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
        <View style={styles.permissionItem}>
            <View style={styles.textContainer}>
                <Text style={styles.permissionTitle}>{title}</Text>
                <Text style={styles.permissionDescription}>{description}</Text>
            </View>
            <TouchableOpacity
                style={[styles.button, isGranted ? styles.grantedButton : styles.grantButton]}
                onPress={onPress}
                disabled={isGranted}
            >
                <Text style={styles.buttonText}>{isGranted ? 'Granted' : 'Grant'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Necessary Permissions</Text>
            <Text style={styles.headerSubtitle}>
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

            <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
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
        color: '#333',
        marginBottom: 5,
    },
    permissionDescription: {
        fontSize: 14,
        color: '#666',
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    grantButton: {
        backgroundColor: '#6200ee',
    },
    grantedButton: {
        backgroundColor: '#4caf50',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    doneButton: {
        marginTop: 20,
        backgroundColor: '#03dac6',
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
