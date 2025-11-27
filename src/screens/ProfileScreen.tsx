import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, themes, ThemeType } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
    const { theme, setTheme, colors } = useTheme();
    const navigation = useNavigation<any>();

    const handleSendFeedback = () => {
        Linking.openURL('mailto:hola@giodigitalmx.com');
    };

    const renderThemeOption = (themeKey: ThemeType, label: string, color: string) => (
        <TouchableOpacity
            style={[
                styles.themeOption,
                {
                    borderColor: theme === themeKey ? colors.primary : 'transparent',
                    backgroundColor: colors.card
                }
            ]}
            onPress={() => setTheme(themeKey)}
        >
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <Text style={[styles.themeText, { color: colors.text }]}>{label}</Text>
            {theme === themeKey && <Icon name="check-circle" size={24} color={colors.primary} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>Settings</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('Permissions')}
                    >
                        <View style={styles.buttonContent}>
                            <Icon name="security" size={24} color={colors.primary} />
                            <Text style={[styles.buttonText, { color: colors.text }]}>Check Permissions</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color={colors.subText} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>Appearance</Text>
                    <View style={styles.themeContainer}>
                        {renderThemeOption('pink', 'Pink', themes.pink.primary)}
                        {renderThemeOption('blue', 'Modern Blue', themes.blue.primary)}
                        {renderThemeOption('purple', 'Purple', themes.purple.primary)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>About</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.devText, { color: colors.text }]}>Developer Info</Text>
                        <Text style={[styles.subDevText, { color: colors.subText }]}>
                            Created with ❤️ by GioDigitalMX
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.feedbackButton, { backgroundColor: colors.primary }]}
                        onPress={handleSendFeedback}
                    >
                        <Icon name="mail" size={20} color="#FFF" />
                        <Text style={styles.feedbackText}>Send Feedback</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
    themeContainer: {
        gap: 10,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        elevation: 1,
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 15,
    },
    themeText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    infoCard: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    devText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subDevText: {
        fontSize: 14,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 10,
    },
    feedbackText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
