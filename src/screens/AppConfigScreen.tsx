import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Image, ScrollView, Dimensions, NativeModules, Animated, Easing, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useApps, AppItem } from '../context/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

const { UsageStatsModule } = NativeModules;

type RootStackParamList = {
    AppConfig: { app: AppItem };
};

type AppConfigRouteProp = RouteProp<RootStackParamList, 'AppConfig'>;

const AppConfigScreen = () => {
    const { colors } = useTheme();
    const { toggleRestriction, updateAppConfig, incrementAvoidedLaunches } = useApps();
    const navigation = useNavigation();
    const route = useRoute<AppConfigRouteProp>();
    const { app } = route.params;

    // Local state for form inputs
    const [cost, setCost] = useState(app.unlockCost);
    const [message, setMessage] = useState(app.motivationalMessage);
    const [isMotivationEnabled, setIsMotivationEnabled] = useState(app.isMotivationEnabled);

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
        // Defer heavy lifting until navigation transition is complete
        const task = InteractionManager.runAfterInteractions(() => {
            fetchUsageHistory();
        });

        return () => task.cancel();
    }, []);

    const fetchUsageHistory = async () => {
        try {
            const history = await UsageStatsModule.getWeeklyUsage(app.packageName);

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

    const handleSave = () => {
        updateAppConfig(app.packageName, {
            unlockCost: cost,
            motivationalMessage: message,
            isMotivationEnabled: isMotivationEnabled
        });
        navigation.goBack();
    };

    const handleToggleRestriction = () => {
        toggleRestriction(app.packageName);
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
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 30,
            marginTop: 20,
        },
        backButton: {
            marginRight: 15,
        },
        headerTitle: {
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.text,
        },
        content: {
            padding: 20,
            paddingTop: 0,
        },
        heroSection: {
            alignItems: 'center',
            marginBottom: 30,
        },
        icon: {
            width: 50,
            height: 50,
            marginBottom: 15,
        },
        placeholderIcon: {
            width: 50,
            height: 50,
            backgroundColor: colors.border,
            borderRadius: 25,
            marginBottom: 15,
        },
        appName: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 5,
        },
        packageName: {
            fontSize: 14,
            color: colors.subText,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        label: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
        },
        subLabel: {
            fontSize: 14,
            color: colors.subText,
            marginTop: 5,
        },
        chartTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 15,
        },
        metricContainer: {
            alignItems: 'center',
        },
        metricValue: {
            fontSize: 36,
            fontWeight: 'bold',
            color: colors.primary,
        },
        metricLabel: {
            fontSize: 14,
            color: colors.subText,
        },
        inputContainer: {
            marginTop: 15,
        },
        textInput: {
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 15,
            color: colors.text,
            marginTop: 10,
            minHeight: 80,
            textAlignVertical: 'top',
        },
        costControls: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
        },
        costButton: {
            backgroundColor: colors.primary,
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        costValue: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginHorizontal: 20,
        },
        saveButton: {
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 40,
        },
        saveButtonText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={30} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuration</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    {app.icon ? (
                        <Image
                            source={{ uri: `data:image/png;base64,${app.icon}` }}
                            style={styles.icon}
                        />
                    ) : (
                        <View style={styles.placeholderIcon} />
                    )}
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.packageName}>{app.packageName}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>Restrict App</Text>
                            <Text style={styles.subLabel}>Enable blocking for this app</Text>
                        </View>
                        <Switch
                            value={app.isRestricted}
                            onValueChange={handleToggleRestriction}
                            trackColor={{ false: "#767577", true: colors.primary }}
                            thumbColor={app.isRestricted ? "#fff" : "#f4f3f4"}
                        />
                    </View>
                </View>

                {app.isRestricted && (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.chartTitle}>Usage History (Last 7 Days)</Text>
                            {isChartReady && (
                                <Animated.View style={{
                                    transform: [
                                        { translateY: scaleY.interpolate({ inputRange: [0, 1], outputRange: [110, 0] }) },
                                        { scaleY: scaleY }
                                    ]
                                }}>
                                    <LineChart
                                        data={chartDataWithMax}
                                        width={Dimensions.get("window").width - 80}
                                        height={220}
                                        yAxisLabel=""
                                        yAxisSuffix=""
                                        fromZero={true}
                                        segments={segments}
                                        formatYLabel={(yValue) => {
                                            const minutes = Math.round(parseFloat(yValue));
                                            if (minutes === 0) return "0m";
                                            if (minutes < 60) return `${minutes}m`;
                                            const hrs = Math.floor(minutes / 60);
                                            const mins = minutes % 60;
                                            return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
                                        }}
                                        chartConfig={{
                                            backgroundColor: colors.card,
                                            backgroundGradientFrom: colors.card,
                                            backgroundGradientTo: colors.card,
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => colors.primary,
                                            labelColor: (opacity = 1) => colors.subText,
                                            style: {
                                                borderRadius: 16
                                            },
                                            propsForDots: {
                                                r: "4",
                                                strokeWidth: "2",
                                                stroke: colors.primary
                                            },
                                            propsForBackgroundLines: {
                                                strokeDasharray: "", // Solid line
                                                strokeWidth: 1,
                                                stroke: colors.border
                                            }
                                        }}
                                        bezier
                                        style={{
                                            marginVertical: 8,
                                            borderRadius: 16
                                        }}
                                    />
                                </Animated.View>
                            )}
                            {!isChartReady && (
                                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: colors.subText }}>Loading usage data...</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.card}>
                            <View style={styles.metricContainer}>
                                <Text style={styles.metricValue}>{app.avoidedLaunches || 0}</Text>
                                <Text style={styles.metricLabel}>Times Avoided</Text>
                                <Text style={[styles.subLabel, { textAlign: 'center', marginTop: 5 }]}>
                                    You chose to save your time instead of paying!
                                </Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.label}>Unlock Cost</Text>
                            <Text style={styles.subLabel}>Coins required for 10 minutes</Text>
                            <View style={styles.costControls}>
                                <TouchableOpacity
                                    style={styles.costButton}
                                    onPress={() => setCost(Math.max(1, cost - 1))}
                                >
                                    <Icon name="remove" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.costValue}>{cost}</Text>
                                <TouchableOpacity
                                    style={styles.costButton}
                                    onPress={() => setCost(cost + 1)}
                                >
                                    <Icon name="add" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.row}>
                                <View>
                                    <Text style={styles.label}>Motivational Message</Text>
                                    <Text style={styles.subLabel}>Show before unlocking</Text>
                                </View>
                                <Switch
                                    value={isMotivationEnabled}
                                    onValueChange={setIsMotivationEnabled}
                                    trackColor={{ false: "#767577", true: colors.primary }}
                                    thumbColor={isMotivationEnabled ? "#fff" : "#f4f3f4"}
                                />
                            </View>
                            {isMotivationEnabled && (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        value={message}
                                        onChangeText={setMessage}
                                        multiline
                                        placeholder="Enter a motivational message..."
                                        placeholderTextColor={colors.subText}
                                    />
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Configuration</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AppConfigScreen;
