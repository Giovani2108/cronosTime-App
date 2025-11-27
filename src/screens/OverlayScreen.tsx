import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, BackHandler, Image, Dimensions, Animated, Easing, InteractionManager } from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useApps } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';

const { OverlayModule, SoundModule, UsageStatsModule } = NativeModules;

const OverlayScreen = (props: any) => {
    // Handle props from both navigation (route.params) and root props (intent extras)
    const params = props.route?.params || props;
    const { packageName, cost, duration, message, showMessage, appIcon, appName } = params || {};

    const { coins, spendCoins } = useWallet();
    const { incrementAvoidedLaunches } = useApps();
    const { colors } = useTheme();
    const [error, setError] = useState<string | null>(null);

    // Chart state
    const [chartData, setChartData] = useState<any>({
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
    });
    const [maxUsage, setMaxUsage] = useState(0);
    const [isChartReady, setIsChartReady] = useState(false);

    // Animation refs
    const scaleY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleExit();
            return true;
        });

        // Fetch usage data after interactions
        const task = InteractionManager.runAfterInteractions(() => {
            if (packageName) {
                fetchUsageHistory();
            }
        });

        return () => {
            backHandler.remove();
            task.cancel();
        };
    }, [packageName]);

    const fetchUsageHistory = async () => {
        try {
            const history = await UsageStatsModule.getWeeklyUsage(packageName);

            const labels: string[] = [];
            const data: number[] = [];
            let max = 0;

            history.forEach((day: any) => {
                const dateObj = new Date(day.date);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                labels.push(dayName);

                const minutes = Math.round(day.usage / 1000 / 60);
                data.push(minutes);
                if (minutes > max) max = minutes;
            });

            setMaxUsage(max);
            setChartData({
                labels,
                datasets: [{ data }]
            });
            setIsChartReady(true);

            // Start native animation
            Animated.timing(scaleY, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();

        } catch (error) {
            console.error("Failed to fetch usage history", error);
        }
    };

    const handleUnlock = async () => {
        if (coins >= cost) {
            const success = await spendCoins(cost);
            if (success) {
                SoundModule.playPurchaseSuccess();
                OverlayModule.unlockApp(packageName, duration);
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

    const segments = Math.max(1, Math.ceil(maxUsage / 30));
    const yAxisMax = segments * 30;

    const chartDataWithMax = {
        ...chartData,
        datasets: [
            ...chartData.datasets,
            {
                data: [yAxisMax],
                color: () => 'transparent',
                strokeWidth: 0,
                withDots: false
            }
        ]
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background, // Full screen dark background
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        card: {
            backgroundColor: colors.card,
            padding: 25,
            borderRadius: 25,
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3,
            shadowRadius: 6.27,
        },
        header: {
            alignItems: 'center',
            marginBottom: 20,
        },
        icon: {
            width: 80,
            height: 80,
            marginBottom: 15,
        },
        placeholderIcon: {
            width: 80,
            height: 80,
            backgroundColor: colors.border,
            borderRadius: 40,
            marginBottom: 15,
        },
        appName: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
        },
        statusText: {
            fontSize: 16,
            color: colors.error,
            fontWeight: '600',
            marginTop: 5,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        chartContainer: {
            width: '100%',
            alignItems: 'center',
            marginBottom: 25,
        },
        chartLabel: {
            fontSize: 14,
            color: colors.subText,
            marginBottom: 10,
            alignSelf: 'flex-start',
        },
        costContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 25,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 50,
        },
        costText: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.primary,
            marginLeft: 10,
        },
        buttonContainer: {
            width: '100%',
            gap: 15,
            marginBottom: 25,
        },
        unlockButton: {
            backgroundColor: colors.primary,
            padding: 18,
            borderRadius: 15,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
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
            borderRadius: 15,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.subText,
        },
        exitText: {
            color: colors.subText,
            fontSize: 16,
            fontWeight: '600',
        },
        messageContainer: {
            marginTop: 10,
            paddingHorizontal: 10,
        },
        message: {
            fontSize: 16,
            color: colors.text,
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 24,
            opacity: 0.8,
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
                <View style={styles.header}>
                    {appIcon ? (
                        <Image
                            source={{ uri: `data:image/png;base64,${appIcon}` }}
                            style={styles.icon}
                        />
                    ) : (
                        <View style={styles.placeholderIcon} />
                    )}
                    <Text style={styles.appName}>{appName || "App Locked"}</Text>
                    <Text style={styles.statusText}>Restricted</Text>
                </View>

                <View style={styles.chartContainer}>
                    <Text style={styles.chartLabel}>Past 7 Days Usage</Text>
                    {isChartReady ? (
                        <Animated.View style={{
                            transform: [
                                { translateY: scaleY.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) },
                                { scaleY: scaleY }
                            ]
                        }}>
                            <LineChart
                                data={chartDataWithMax}
                                width={Dimensions.get("window").width - 90} // Adjusted for card padding
                                height={160}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero={true}
                                segments={segments}
                                formatYLabel={(yValue) => {
                                    const minutes = Math.round(parseFloat(yValue));
                                    if (minutes === 0) return "0m";
                                    if (minutes < 60) return `${minutes}m`;
                                    const hrs = Math.floor(minutes / 60);
                                    return `${hrs}h`;
                                }}
                                chartConfig={{
                                    backgroundColor: colors.card,
                                    backgroundGradientFrom: colors.card,
                                    backgroundGradientTo: colors.card,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => colors.primary,
                                    labelColor: (opacity = 1) => colors.subText,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "3", strokeWidth: "1", stroke: colors.primary },
                                    propsForBackgroundLines: { strokeDasharray: "", strokeWidth: 1, stroke: 'rgba(255,255,255,0.1)' }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                            />
                        </Animated.View>
                    ) : (
                        <View style={{ height: 160, justifyContent: 'center' }}>
                            <Text style={{ color: colors.subText }}>Loading...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.costContainer}>
                    <Icon name="monetization-on" size={24} color={colors.primary} />
                    <Text style={styles.costText}>{cost} Coins / {duration} min</Text>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
                        <Icon name="lock-open" size={24} color="#fff" />
                        <Text style={styles.unlockText}>Unlock Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                        <Text style={styles.exitText}>I'll do something else</Text>
                    </TouchableOpacity>
                </View>

                {showMessage && message && (
                    <View style={styles.messageContainer}>
                        <Text style={styles.message}>"{message}"</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default OverlayScreen;
