import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTasks, FirstDayOfWeek, NextWeekBehavior } from '../context/TaskContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { strings } from '../utils/i18n';

const CustomizationScreen = () => {
    const { colors } = useTheme();
    const { firstDayOfWeek, setFirstDayOfWeek, nextWeekBehavior, setNextWeekBehavior } = useTasks();
    const navigation = useNavigation();

    const renderRadioOption = (
        selected: boolean,
        label: string,
        onPress: () => void
    ) => (
        <TouchableOpacity
            style={[styles.radioOption, { backgroundColor: colors.card }]}
            onPress={onPress}
        >
            <Text style={[styles.radioLabel, { color: colors.text }]}>{label}</Text>
            <View style={[styles.radioCircle, { borderColor: colors.primary }]}>
                {selected && <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{strings.customize}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>
                        {strings.firstDayOfWeek}
                    </Text>
                    {renderRadioOption(
                        firstDayOfWeek === 'Saturday',
                        strings.saturday,
                        () => setFirstDayOfWeek('Saturday')
                    )}
                    {renderRadioOption(
                        firstDayOfWeek === 'Sunday',
                        strings.sunday,
                        () => setFirstDayOfWeek('Sunday')
                    )}
                    {renderRadioOption(
                        firstDayOfWeek === 'Monday',
                        strings.monday,
                        () => setFirstDayOfWeek('Monday')
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>
                        {strings.nextWeekBehavior}
                    </Text>
                    {renderRadioOption(
                        nextWeekBehavior === 'sameDay',
                        strings.sameDay,
                        () => setNextWeekBehavior('sameDay')
                    )}
                    {renderRadioOption(
                        nextWeekBehavior === 'startOfWeek',
                        strings.startOfWeek,
                        () => setNextWeekBehavior('startOfWeek')
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
    },
    radioLabel: {
        fontSize: 16,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default CustomizationScreen;
