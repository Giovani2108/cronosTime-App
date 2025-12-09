import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'pink' | 'blue' | 'purple';

export const themes = {
    pink: {
        background: '#FFF0F5', // Lavender Blush
        card: '#FFFFFF',
        text: '#4A0E4E',
        subText: '#8E44AD',
        primary: '#FF69B4', // Hot Pink
        border: '#FFC0CB',
        success: '#4caf50',
        error: '#f44336',
        icon: '#FF1493',
        surface: '#FFFFFF'
    },
    blue: {
        background: '#E3F2FD', // Light Blue
        card: '#FFFFFF',
        text: '#0D47A1',
        subText: '#1976D2',
        primary: '#2196F3', // Blue
        border: '#BBDEFB',
        success: '#4caf50',
        error: '#f44336',
        icon: '#1565C0',
        surface: '#FFFFFF'
    },
    purple: {
        background: '#F3E5F5', // Purple 50
        card: '#FFFFFF',
        text: '#4A148C',
        subText: '#7B1FA2',
        primary: '#9C27B0', // Purple
        border: '#E1BEE7',
        success: '#4caf50',
        error: '#f44336',
        icon: '#7B1FA2',
        surface: '#FFFFFF'
    }
};

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    colors: typeof themes.pink;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'blue',
    setTheme: () => { },
    colors: themes.blue,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeType>('blue');

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme_preference');
            if (savedTheme && (savedTheme === 'pink' || savedTheme === 'blue' || savedTheme === 'purple')) {
                setThemeState(savedTheme as ThemeType);
            }
        } catch (e) {
            console.error('Failed to load theme preference', e);
        }
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('theme_preference', newTheme);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const colors = themes[theme];

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
