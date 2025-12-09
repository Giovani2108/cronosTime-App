import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ProgressBarAndroid, Platform, Animated, Image } from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CompactHeader = ({ onEarnCoins }: { onEarnCoins: () => void }) => {
    const { coins } = useWallet();
    const { colors } = useTheme();
    const [displayCoins, setDisplayCoins] = React.useState(coins);
    const animatedCoins = useRef(new Animated.Value(coins)).current;

    useEffect(() => {
        Animated.timing(animatedCoins, {
            toValue: coins,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [coins]);

    useEffect(() => {
        const listener = animatedCoins.addListener(({ value }) => {
            setDisplayCoins(Math.round(value));
        });
        return () => animatedCoins.removeListener(listener);
    }, [animatedCoins]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.profileContainer}>
                {/* Avatar */}
                <View style={[styles.avatarContainer, { backgroundColor: '#C8A2C8' }]}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }}
                        style={styles.avatar}
                    />
                </View>

                {/* Info */}
                <View style={styles.textContainer}>
                    <Text style={[styles.nameText, { color: colors.text }]}>Player One</Text>
                    <Text style={[styles.subText, { color: colors.subText }]}>Lvl 4</Text>
                </View>
            </View>

            {/* Coins & Earn Button */}
            <View style={styles.rightSection}>
                <View style={[styles.coinBadge, { borderColor: colors.border }]}>
                    <Icon name="monetization-on" size={24} color="#FFD700" />
                    <Text style={[styles.coinText, { color: colors.text }]}>{displayCoins}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.earnButton, { backgroundColor: colors.primary }]}
                    onPress={onEarnCoins}
                    activeOpacity={0.7}
                >
                    <Icon name="add" size={20} color="#FFF" />
                    <Text style={styles.earnText}>Earn 10</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 40, // Aligns with ConfigurationScreen (padding 20 + margin 20)
        paddingBottom: 20,
        paddingHorizontal: 20, // Match ConfigurationScreen padding
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    profileContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30, // Circular
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    avatar: {
        width: 50,
        height: 50,
    },
    textContainer: {
        justifyContent: 'center',
    },
    nameText: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        fontWeight: '500',
    },
    rightSection: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    coinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 8,
    },
    coinText: {
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 18,
    },
    earnButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    earnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default CompactHeader;
