import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { AppItem, useApps } from '../context/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BarChart } from 'react-native-chart-kit';
import { NativeModules } from 'react-native';
import { strings } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';

const { UsageStatsModule } = NativeModules;

interface AppDetailsProps {
    visible: boolean;
    app: AppItem;
    onClose: () => void;
}

interface UsageData {
    date: string;
    usage: number;
}

const AppDetailsComponent: React.FC<AppDetailsProps> = ({ visible, app, onClose }) => {
    const { updateAppConfig } = useApps();
    const { colors } = useTheme();
    const [cost, setCost] = useState(app.unlockCost.toString());
    const [duration, setDuration] = useState((app.unlockDuration / 60000).toString());
    const [weeklyUsage, setWeeklyUsage] = useState<{ date: string, usage: number }[]>([]);

    useEffect(() => {
        if (visible) {
            setCost(app.unlockCost.toString());
            setDuration((app.unlockDuration / 60000).toString());
            loadWeeklyUsage();
        }
    }, [visible, app]);

    const loadWeeklyUsage = async () => {
        try {
            const stats = await UsageStatsModule.getWeeklyUsage(app.packageName);
            setWeeklyUsage(stats);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = () => {
        const newCost = parseInt(cost) || 10;
        const newDuration = (parseInt(duration) || 5) * 60 * 1000;
        updateAppConfig(app.packageName, newCost, newDuration);
        onClose();
    };

    const chartData = {
        labels: weeklyUsage.map(d => d.date.substring(5)), // MM-DD
        datasets: [{
            data: weeklyUsage.map(d => d.usage / 60000) // minutes
        }]
    };

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => colors.primary,
        labelColor: (opacity = 1) => colors.subText,
        strokeWidth: 2,
        barPercentage: 0.5,
    };

    const styles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        container: {
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            maxHeight: '90%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
            flex: 1,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginTop: 20,
            marginBottom: 10,
        },
        inputContainer: {
            marginBottom: 15,
        },
        label: {
            fontSize: 14,
            color: colors.subText,
            marginBottom: 5,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.background,
        },
        saveButton: {
            backgroundColor: colors.primary,
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20,
        },
        saveButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    });

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{app.appName}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <Text style={styles.sectionTitle}>{strings.configuration}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{strings.costPerUnlock}</Text>
                            <TextInput
                                style={styles.input}
                                value={cost}
                                onChangeText={setCost}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{strings.durationMinutes}</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                            />
                        </View>

                        <Text style={styles.sectionTitle}>{strings.weeklyUsage}</Text>
                        {weeklyUsage.length > 0 ? (
                            <BarChart
                                data={chartData}
                                width={Dimensions.get('window').width - 80}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix="m"
                                chartConfig={chartConfig}
                                verticalLabelRotation={30}
                                style={{ borderRadius: 16 }}
                            />
                        ) : (
                            <Text style={{ color: colors.subText }}>{strings.loadingStats}</Text>
                        )}

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>{strings.save}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default AppDetailsComponent;
