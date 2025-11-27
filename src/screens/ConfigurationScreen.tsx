import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApps, AppItem } from '../context/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppDetailsComponent from '../components/AppDetailsComponent';
import { strings } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';


const { SoundModule } = NativeModules;

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const ConfigurationScreen = () => {
    const { apps, toggleRestriction, loadApps } = useApps();
    const [selectedApp, setSelectedApp] = React.useState<AppItem | null>(null);
    const { colors } = useTheme();

    useEffect(() => {
        loadApps();
    }, []);

    const handleToggle = (packageName: string) => {
        SoundModule.playBubblePop();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        toggleRestriction(packageName);
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
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        actionButton: {
            flex: 1,
            backgroundColor: colors.primary,
            padding: 10,
            borderRadius: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 5,
        },
        refreshButton: {
            backgroundColor: colors.success,
            marginLeft: 5,
            marginRight: 0,
        },
        actionButtonText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 12,
        },
        btnIcon: {
            marginRight: 5,
        },
        list: {
            paddingBottom: 20,
        },
        appItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.card,
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
        },
        appInfo: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        icon: {
            width: 40,
            height: 40,
            resizeMode: 'contain',
            marginRight: 15,
        },
        placeholderIcon: {
            width: 40,
            height: 40,
            backgroundColor: colors.border,
            borderRadius: 20,
            marginRight: 15,
        },
        textContainer: {
            flex: 1,
        },
        appName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
        },
        packageName: {
            fontSize: 12,
            color: colors.subText,
        },
        statusContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        restrictedText: {
            color: colors.error,
            marginRight: 10,
            fontWeight: 'bold',
        },
        unrestrictedText: {
            color: colors.success,
            marginRight: 10,
            fontWeight: 'bold',
        },
        separator: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 15,
            marginBottom: 20,
        },
    });

    const renderItem = ({ item, index }: { item: AppItem, index: number }) => {
        // Check if we need a separator
        // We assume apps are sorted: Restricted first, then Unrestricted
        const isFirstUnrestricted = !item.isRestricted && (index === 0 || apps[index - 1].isRestricted);

        return (
            <View>
                {isFirstUnrestricted && index > 0 && (
                    <View style={styles.separator} />
                )}
                <TouchableOpacity
                    style={styles.appItem}
                    onPress={() => setSelectedApp(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.appInfo}>
                        {item.icon ? (
                            <Image
                                source={{ uri: `data:image/png;base64,${item.icon}` }}
                                style={styles.icon}
                            />
                        ) : (
                            <View style={styles.placeholderIcon} />
                        )}
                        <View style={styles.textContainer}>
                            <Text style={styles.appName}>{item.appName}</Text>
                            <Text style={styles.packageName}>{item.packageName}</Text>
                        </View>
                    </View>
                    <View style={styles.statusContainer}>
                        <TouchableOpacity onPress={() => handleToggle(item.packageName)}>
                            <Icon
                                name={item.isRestricted ? "lock" : "lock-open"}
                                size={24}
                                color={item.isRestricted ? colors.error : colors.success}
                            />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>

                <Text style={styles.title}>{strings.selectApps}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.actionButton, { marginLeft: 0 }]} onPress={loadApps}>
                    <Icon name="refresh" size={20} color="#fff" style={styles.btnIcon} />
                    <Text style={styles.actionButtonText}>{strings.refreshApps}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={apps}
                renderItem={renderItem}
                keyExtractor={item => item.packageName}
                contentContainerStyle={styles.list}
            />

            {selectedApp && (
                <AppDetailsComponent
                    visible={!!selectedApp}
                    app={selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </SafeAreaView>
    );
};

export default ConfigurationScreen;
